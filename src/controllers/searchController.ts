import { Request, Response } from "express";
import { searchQueryType } from "../types/zod/types";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import { Prisma } from "@prisma/client";

// Define a type for the result to improve type safety

export const getPaginatedCompanies = async (req: Request, res: Response) => {
  // Assuming 'searchQueryType' is defined elsewhere
  const { sentiment, industry, sentimentScoreLimit, page, limit, searchQuery } =
    req.query as searchQueryType;

  const pageNumber = page ? Number(page) : 1;
  const itemsLength = limit ? Number(limit) : 10;
  // CRITICAL FIX: The offset calculation was incorrect. It should be (page - 1) * limit.
  const offset = (pageNumber - 1) * itemsLength;
  const conditions: Prisma.Sql[] = [];
  if (searchQuery) {
    conditions.push(Prisma.sql`s.name ILIKE ${`%${searchQuery}%`}`);
  }
  if (industry) {
    conditions.push(Prisma.sql`sec.name ILIKE ${`%${industry}%`}`);
  }
  if (sentimentScoreLimit !== undefined) {
    conditions.push(Prisma.sql`coalesce(st.avg_sentiment_score,0) >= -1`);
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
    // 1. Your original query for the page's data
    const results  = await prisma.$queryRaw<{id:string; name:string; sector:string; imageUrl:string; description:string;avg_sentiment_score:number; total_articles:number}[]>`
    WITH stats AS (
      SELECT "startupId" , 
      coalesce(avg(
          CASE 
            WHEN "sentiment" != 'neutral' THEN "positiveScore" - "negativeScore" 
            ELSE NULL 
          END
        ), 0.0) as "avg_sentiment_score",
      coalesce(cast(count(*) AS INT), 0) AS "total_articles"
      FROM "ArticlesSentiment" 
      GROUP BY "startupId"
    )
    SELECT s.id, s.name, sec.name AS sector, s."imageUrl", s.description, 
           COALESCE(st."avg_sentiment_score", 0) AS "avg_sentiment_score", 
           COALESCE(st."total_articles", 0) AS "total_articles" 
    FROM "Startups" s
    INNER JOIN "stats" st ON s.id = st."startupId"
    LEFT JOIN "Sector" sec ON sec.id = s."sectorId"
    ${whereClause}  -- Your dynamic WHERE clause
    LIMIT ${itemsLength}
    OFFSET ${offset}
  `;
    // 2. The new query to get the TOTAL count
    const countResult: [{ totalCount: bigint }] = await prisma.$queryRaw`
    WITH stats AS (
      -- This CTE must be IDENTICAL to the one above
      SELECT "startupId" , 
      coalesce(avg(
          CASE 
            WHEN "sentiment" != 'neutral' THEN "positiveScore" - "negativeScore" 
            ELSE NULL 
          END
        ), 0.0) as "avg_sentiment_score",
      coalesce(cast(count(*) AS INT), 0) AS "total_articles"
      FROM "ArticlesSentiment" 
      GROUP BY "startupId"
    )
    SELECT count(s.id) AS "totalCount" -- Select the count
    FROM "Startups" s
    INNER JOIN "stats" st ON s.id = st."startupId"
    LEFT JOIN "Sector" sec ON sec.id = s."sectorId"
    ${whereClause}  -- Use the IDENTICAL WHERE clause
    -- No LIMIT or OFFSET
  `;

    // 3. Extract the count (and convert from BigInt)
    const totalCount: number = Number(countResult[0].totalCount);
    res.status(200).json({
      startups: results,
      meta: {
        total: Number(totalCount),
        page: pageNumber,
        limit: itemsLength,
        totalPages: Math.ceil(Number(totalCount) / itemsLength),
      },
    });
  } catch (error: any) {
    logger.error("Error in fetching the dashboard Stats", {
      //   id: req.user.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ error: "This was a server error in fetching stats" });
  }
};
export const getPaginatedNews = async (req: Request, res: Response) => {
  const { sentiment, industry, page, limit, searchQuery, companyId } =
    req.query as searchQueryType;
  const pageNumber = page ? Number(page) : 1;
  const itemsLength = limit ? Number(limit) : 10;
  const offset = (pageNumber - 1) * itemsLength;
  const whereClause = {
    ...(searchQuery && {
      ArticlesSentiment: {
        some: {
          Startups: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        },
      },
    }),
    ...(sentiment && {
      ArticlesSentiment: {
        some: {
          sentiment: sentiment,
        },
      },
    }),
    ...(industry && {
      ArticlesSentiment: {
        some: {
          Startups: {
            sector: {
              name: {
                contains: industry,
              },
            },
          },
        },
      },
    }),
    ...(companyId &&
      companyId !== "" && {
        ArticlesSentiment: {
          some: {
            startupId: companyId,
          },
        },
      }),
  };
  try {
    const pagiantedNewsData = await prisma.articles.findMany({
      skip: offset,
      take: itemsLength,
      where: whereClause,
      
      include: {
        ArticlesSentiment: {
          
          omit: {
            createdAt: true,
            articleId: true,
            startupId: true,
          },
          include: {
            Startups: {
              select: {
                id: true,
                name: true,
                sector: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      omit: {
        createdAt: true,
      },
    });
    const totalNewsItems: number = await prisma.articles.count({
      where: whereClause,
    });
    res.status(200).json({
      paginatedNews: pagiantedNewsData,
      paginationInfo: {
        totalItems: totalNewsItems,
        pageNumber,
        itemsLength,
        totalPages: Math.ceil(totalNewsItems / itemsLength),
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
