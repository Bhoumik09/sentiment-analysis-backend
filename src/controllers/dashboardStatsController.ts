import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
export const dashBoardAnalytics = async (req: Request, res: Response) => {
  //get startup count
  try {
    const totalStartups = await prisma.startups.count();
    //get articles count based on sentiment
    const totalArticles: {
      Positive: bigint;
      Negative: bigint;
      Neutral: bigint;
      totalArticles: bigint;
    }[] = await prisma.$queryRaw`SELECT
  COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)*1 as "Positive",
  COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)*1 as "Negative",
  COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END)*1 as "Neutral",
  count(*) as "totalArticles"
FROM "Articles";`;
    const statusGrouping = totalArticles.map((articles) => ({
      postiveCount: Number(articles.Positive),
      negativeCount: Number(articles.Negative),
      neutralCount: Number(articles.Neutral),
      totalCount: Number(articles.totalArticles),
    }))[0];
    //compare total startup count to last month
    const monthCompare: {
      currentMonthCount: bigint;
      previousMonthCount: bigint;
    }[] = await prisma.$queryRaw`
    SELECT
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW())) AS "currentMonthCount",
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW() - interval '1 month')) AS "previousMonthCount"
    FROM "Startups";
    `;

    const monthIncDecStats =
      Number(monthCompare[0].currentMonthCount) -
      Number(monthCompare[0].previousMonthCount);

    //get previous and current week trends for comparison
    const articlesWeeklyStats: {
      currentWeekPositive: bigint;
      currentWeekNegative: bigint;
      previousWeekPositive: bigint;
      previousWeekNegative: bigint;
      avg_sentiment:bigint;
    }[] = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE sentiment = 'positive' AND date_trunc('week', "publishedAt") <= date_trunc('week', NOW())) AS "currentWeekPositive",
        COUNT(*) FILTER (WHERE sentiment = 'negative' AND date_trunc('week', "publishedAt") <= date_trunc('week', NOW())) AS "currentWeekNegative",
        COUNT(*) FILTER (WHERE sentiment = 'positive' AND date_trunc('week', "publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekPositive",
        COUNT(*) FILTER (WHERE sentiment = 'negative' AND date_trunc('week', "publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekNegative",
        AVG("sentimentScores") AS "avg_sentiment"
      FROM "Articles"
    `;
    const positiveTrendArticles = 
      ((Number(articlesWeeklyStats[0].currentWeekPositive) -
        Number(articlesWeeklyStats[0].previousWeekPositive)) *
        100) /
        (Number(articlesWeeklyStats[0].previousWeekPositive) === 0
          ? 1
          : Number(articlesWeeklyStats[0].previousWeekPositive))
    ;
    const negativeTrendArticles = 
      ((Number(articlesWeeklyStats[0].currentWeekNegative) -
        Number(articlesWeeklyStats[0].previousWeekNegative)) *
        100) /
        (Number(articlesWeeklyStats[0].previousWeekNegative) === 0
          ? 1
          : Number(articlesWeeklyStats[0].previousWeekNegative))
    ;
    const neutralTrendArticles = Number(articlesWeeklyStats[0].avg_sentiment)
    res.status(200).json({
      statsResult: {
        totalStartups,
        statusGrouping,
        startUpAnalytics: monthIncDecStats,
        positiveTrendArticles,
        negativeTrendArticles,
        avgSentiment:neutralTrendArticles
      },
    });
  } catch (e: any) {
    logger.error("Error in fetching the dashboard Analytics", {
      id: req.user.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "This was a server error in fetching stats" });
  }
};
export const TrendingStartups = async (req: Request, res: Response) => {
  //get 4 startups with more articles in the present week
  try {
    const startupsWithMaxCount:
      | {
          startupId: string;
          name: string;
          percentage_change: number;
          current_sentiment: number;
        }[]
      | null = await prisma.$queryRaw`
  WITH top_startups AS (
    SELECT COUNT(*) AS "articlesCount", "startupId" FROM "Articles"
    WHERE "publishedAt" >= CURRENT_DATE - INTERVAL '7 day'
    GROUP BY "startupId" ORDER BY "articlesCount" DESC
    LIMIT 4
),
sentiment_overall_trends AS (
    select
    "startupId",
    AVG("sentimentScores") AS current_sentiment,
    coalesce(AVG(CASE WHEN "publishedAt" <= CURRENT_DATE - INTERVAL '7 day' THEN "sentimentScores" END),0) AS previous_sentiment
    from "Articles"
    WHERE "startupId" IN (SELECT "startupId" FROM "top_startups")
    group by "startupId" 
)
select 
    s."startupId",
    st."name",
    round(cast(s."current_sentiment" as NUMERIC),3) as "current_sentiment",
    cast((((s.current_sentiment+1) - (s.previous_sentiment+1)) * 100.0) / coalesce(NULLIF(s.previous_sentiment, 0),1) as INT) AS "percentage_change"
    from "sentiment_overall_trends" as "s" inner join "Startups" st on s."startupId"=st."id"
    order by  "percentage_change" desc
  `;
    if (!startupsWithMaxCount) {
      logger.error("Error in fetching the dashboard Analytics", {
        id: req?.user?.id,
        error: "Unable to fetch dashboard analytics due to sql query error",
      });
      res
        .status(404)
        .json({ error: "This was a server error in fetching stats" });
    }
    res.status(200).json({ trendingStartups: startupsWithMaxCount });
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
