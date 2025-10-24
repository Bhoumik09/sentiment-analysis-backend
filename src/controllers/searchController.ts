import { Request, Response } from "express";
import { searchQueryType } from "../types/zod/types";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import { Prisma } from "@prisma/client";

// Define a type for the result to improve type safety
interface StartupWithStats {
  id: string;
  name: string;
  sector: string;
  total_articles: bigint | null;
  avg_sentiment_score: number;
  total_count: bigint | null;

  // New properties for Article 1 (latest)
  latest_article_1_title: string | null;
  latest_article_1_url: string | null;
  latest_article_1_content: string | null;
  latest_article_1_published_at: Date | null;
  latest_article_1_sentiment_score: number | null; // New properties for Article 1
  latest_article_1_sentiment: string | null; // New properties for Article 1

  // New properties for Article 2
  latest_article_2_title: string | null;
  latest_article_2_url: string | null;
  latest_article_2_content: string | null;
  latest_article_2_published_at: Date | null;
  latest_article_2_sentiment_score: number | null; // New properties for Article 2
  latest_article_2_sentiment: string | null;

  // New properties for Article 3
  latest_article_3_title: string | null;
  latest_article_3_url: string | null;
  latest_article_3_content: string | null;
  latest_article_3_published_at: Date | null;
  latest_article_3_sentiment_score: number | null; // New properties for Article 3
  latest_article_3_sentiment: string | null;
}
interface StartupResult {
  id: string;
  name: string;
  sector: string;
  total_articles: number | null;
  avg_sentiment_score: number;

  latestArticles: {
    title: string | null;
    url: string | null;
    content: string | null;
    publishedAt: Date | null;
    sentimentScore: number | null;
    sentiment: string | null;
  }[];
}
export const search = async (req: Request, res: Response) => {
  // Assuming 'searchQueryType' is defined elsewhere
  const { sentiment, industry, sentimentScoreLimit, page, limit, searchQuery } =
    req.query as searchQueryType;

  const pageNumber = page ? Number(page) : 1;
  const itemsLength = limit ? Number(limit) : 10;
  // CRITICAL FIX: The offset calculation was incorrect. It should be (page - 1) * limit.
  const offset = (pageNumber - 1) * itemsLength;
  console.log(sentimentScoreLimit);
  const conditions: Prisma.Sql[] = [];
  if (searchQuery) {
    conditions.push(Prisma.sql`s.name ILIKE ${`%${searchQuery}%`}`);
  }
  if (industry) {
    conditions.push(Prisma.sql`s.sector ILIKE ${`%${industry}%`}`);
  }
  if (sentimentScoreLimit !== undefined) {
    conditions.push(
      Prisma.sql`coalesce(st.avg_sentiment_score,0) >= -1`
    );
  }
  if (sentiment) {
    if (sentiment === "positive")
      conditions.push(Prisma.sql`st.avg_sentiment_score > .01`);
    if (sentiment === "negative")
      conditions.push(Prisma.sql`st.avg_sentiment_score < -0.01`);
    // A slightly cleaner way to write the neutral condition
    if (sentiment === "neutral")
      conditions.push(
        Prisma.sql`st.avg_sentiment_score BETWEEN -0.01 AND 0.01`
      );
  }

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : "";
  try {
    // --- The Single, Optimized Query ---
    const results:any[] = await prisma.$queryRaw`
    with stats as (
      select "startupId" , 
      coalesce(avg("sentimentScore"),0.0) as "avg_sentiment_score", 
      coalesce(cast(count(*) as INT),0) as "total_articles"
      from "ArticlesSentiment" 
      group by  "startupId"
    )
    select s.id, s.name, s.sector, s."imageUrl",s.description, COALESCE(st."avg_sentiment_score", 0) AS "avg_sentiment_score", 
    COALESCE(st."total_articles", 0) AS "total_articles" from "Startups" s
    left join "stats" st on s.id = st."startupId"

    ${whereClause}
    LIMIT ${itemsLength}
    OFFSET ${offset}
  `;
    // Extract the total count from the first result row. If no results, count is 0.
    const totalCount = await prisma.startups.count();
    res.status(200).json({
      startups: results,
      meta: {
        total: totalCount,
        page: pageNumber,
        limit: itemsLength,
        totalPages: Math.ceil(totalCount / itemsLength),
      },
    });
  } catch (error: any) {
    logger.error("Error in fetching the dashboard Analytics", {
      //   id: req.user.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ error: "This was a server error in fetching stats" });
  }
};
