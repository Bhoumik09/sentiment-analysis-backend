import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
export const dashBoardAnalytics = async (req: Request, res: Response):Promise<void> => {
  try {
      //get startup count
    const totalStartups:number = await prisma.startups.count();
    //get articles count based on sentiment
    const totalArticles  = await prisma.$queryRaw<{
      Positive: bigint;
      Negative: bigint;
      Neutral: bigint;
      totalArticles: bigint;
    }[]>`SELECT
  COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)*1 as "Positive",
  COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)*1 as "Negative",
  COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END)*1 as "Neutral",
  count(*) as "totalArticles"
FROM "ArticlesSentiment";`;
    //group the stats data together
    const statusGrouping:{
      postiveCount: number;
      negativeCount: number;
      neutralCount:number;
      totalCount: number;
    } = totalArticles.map((articles) => ({
      postiveCount: Number(articles.Positive),
      negativeCount: Number(articles.Negative),
      neutralCount: Number(articles.Neutral),
      totalCount: Number(articles.totalArticles),
    }))[0];
    //compare total startup count to last month
    const monthCompare  = await prisma.$queryRaw<{
      currentMonthCount: bigint;
      previousMonthCount: bigint;
    }[]>`
    SELECT
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW())) AS "currentMonthCount",
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW() - interval '1 month')) AS "previousMonthCount"
    FROM "Startups";
    `;

    const monthIncDecStats:number =
      Number(monthCompare[0].currentMonthCount) -
      Number(monthCompare[0].previousMonthCount);

    //get previous and current week trends for comparison
    const articlesWeeklyStats = await prisma.$queryRaw<{
      currentWeekPositive: bigint;
      currentWeekNegative: bigint;
      previousWeekPositive: bigint;
      previousWeekNegative: bigint;
      avg_sentiment: bigint;
    }[]>`
      SELECT
        COUNT(*) FILTER (WHERE als.sentiment = 'positive' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW())) AS "currentWeekPositive",
        COUNT(*) FILTER (WHERE als.sentiment = 'negative' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW())) AS "currentWeekNegative",
        COUNT(*) FILTER (WHERE als.sentiment = 'positive' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekPositive",
        COUNT(*) FILTER (WHERE als.sentiment = 'negative' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekNegative",
        AVG(als."positiveScore"-als."negativeScore") AS "avg_sentiment"
      FROM "Articles" as a inner join "ArticlesSentiment" as als
      ON a.id = als."articleId"
    `;
    const positiveTrendArticles:number =
      ((Number(articlesWeeklyStats[0].currentWeekPositive) -
        Number(articlesWeeklyStats[0].previousWeekPositive)) *
        100) /
      (Number(articlesWeeklyStats[0].previousWeekPositive) === 0
        ? 1
        : Number(articlesWeeklyStats[0].previousWeekPositive));
    const negativeTrendArticles:number =
      ((Number(articlesWeeklyStats[0].currentWeekNegative) -
        Number(articlesWeeklyStats[0].previousWeekNegative)) *
        100) /
      (Number(articlesWeeklyStats[0].previousWeekNegative) === 0
        ? 1
        : Number(articlesWeeklyStats[0].previousWeekNegative));
    const neutralTrendArticles:number = Number(articlesWeeklyStats[0].avg_sentiment);
    res.status(200).json({
      statsResult: {
        totalStartups,
        statusGrouping,
        startUpAnalytics: monthIncDecStats,
        positiveTrendArticles,
        negativeTrendArticles,
        avgSentiment: neutralTrendArticles,
      },
    });
  } catch (e: any) {
    logger.error("Error in fetching the dashboard Analytics", {
      id: req.user?.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "This was a server error in fetching stats" });
  }
};
export const TrendingStartups = async (req: Request, res: Response):Promise<void> => {
  //get 4 startups with more articles in the present week
  try {
    const trendingStartups  = await prisma.$queryRawUnsafe<{id:string;name:string;current_week_article_count:bigint; overall_avg_sentiment:number}[]>(`
      WITH StartupStats AS (
        SELECT
          s.id,
          s.name,
          -- Count articles published within the last 7 days
          COUNT(CASE WHEN a."publishedAt" >= CURRENT_DATE - INTERVAL '7 day' THEN 1 END) AS current_week_article_count,
          -- Calculate the overall average sentiment score across ALL linked articles
          -- AVG ignores NULLs automatically. COALESCE handles startups with 0 articles/scores.
          COALESCE(AVG(als."positiveScore"- als."negativeScore"), 0.0) AS overall_avg_sentiment
        FROM
          "Startups" s
        -- LEFT JOIN ensures startups with 0 articles are still considered (count will be 0)
        LEFT JOIN
          "ArticlesSentiment" als ON s.id = als."startupId"
        LEFT JOIN
          "Articles" a ON als."articleId" = a.id
        GROUP BY
          s.id, s.name -- Group by startup to aggregate counts and averages
      )
      -- Select the final results from the calculated stats
      SELECT
        id,
        name,
        current_week_article_count,
        overall_avg_sentiment
      FROM
        StartupStats
      -- Order by the count of articles from the current week to find the 'trending' ones
      ORDER BY
        current_week_article_count DESC NULLS LAST -- Highest count first, treat NULLs (shouldn't happen) as lowest
      LIMIT 4; -- Get only the top 4
    `);
    // Raw queries can return BigInt for counts, convert them to Number
    if (!trendingStartups) {
      logger.error("Error in fetching the dashboard Analytics", {
        id: req?.user?.id,
        error: "Unable to fetch dashboard analytics due to sql query error",
      });
      res
        .status(404)
        .json({ error: "This was a server error in fetching stats" });
    }
    // The result might contain BigInt for counts, convert them if necessary

    const formattedResults:{
      id: string;
      name: string;
      currentWeekArticleCount: number;
      current_sentiment: number;
    }[] = trendingStartups.map((startup) => ({
      id: startup.id,
      name: startup.name,
      currentWeekArticleCount: Number(startup.current_week_article_count),
      // Round the average sentiment for cleaner display
      current_sentiment: parseFloat(startup.overall_avg_sentiment.toFixed(3)),
    }));

    res.status(200).json({ trendingStartups: formattedResults });
  } catch (e: any) {
    logger.error("Error in fetching the dashboard Analytics", {
      id: req?.user?.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "This was a server error in fetching stats" });
  }
};
