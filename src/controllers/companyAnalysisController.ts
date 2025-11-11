import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import { companyNewsData, CompanySentimentRow, GroupedSentimentResponse } from "../types/all";
import { Prisma } from "@prisma/client";
import { AcceleratePromise } from "@prisma/extension-accelerate";
export interface companyInfo {
  positiveCount: bigint;
  negativeCount: bigint;
  neutralCount: bigint;
  totalArticles: bigint;
  averageSentimentScore: number;
}
export const companySentimentInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.params as { companyId: string };
    const sentimentStats = (await prisma.articlesSentiment.groupBy({
      by: ["sentiment"],
      where: {
        startupId: companyId,
      },
      _count: {
        articleId: true,
      },
    })) as
      | {
          sentiment: string;
          _count: {
            articleId: number;
          };
        }[]
      | null;
    const formattedResults: { sentiment: string; sentimentCount: number }[] =
      sentimentStats.map((sentiment) => ({
        sentiment: sentiment.sentiment,
        sentimentCount: sentiment._count.articleId,
      }));
    res.status(200).json({ sentimentStats: formattedResults });
  } catch (error: any) {
    logger.error("There was an error in fetching company's details", {
      id: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      error: "There was an error in fetching company's details",
    });
  }
};

export const companyInformation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params as { companyId: string };
    const companyId: string = id.companyId;

    const companyInfoQuery: Promise<
      {
        sector: {
          name: string;
          id: number;
        };
      } & {
        id: string;
        name: string;
        sectorId: number;
        description: string | null;
        imageUrl: string | null;
      }
    > = prisma.startups.findUnique({
      where: {
        id: companyId,
      },
      include: {
        sector: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      omit: {
        createdAt: true,
        findingKeywords: true,
      },
    });
    const companyAvgSentimentQuery: Promise<{
      _sum: { positiveScore: number; negativeScore: number };
      _count: { _all: number };
    }> = prisma.articlesSentiment.aggregate({
      _sum: {
        positiveScore: true,
        negativeScore: true,
      },
      _count: {
        _all: true,
      },
      where: {
        startupId: companyId,
      },
    });
    const neutralCountQuery = prisma.articlesSentiment.count({
      where: {
        startupId: companyId,
        sentiment: "neutral", // Filter for neutral here
      },
    });
    const [companyInfo, companyAvgSentiment, neutralCount] = await Promise.all([
      companyInfoQuery,
      companyAvgSentimentQuery,
      neutralCountQuery,
    ]);
    const count: number = companyAvgSentiment._count._all - neutralCount;
    const totalPositive: number = companyAvgSentiment._sum.positiveScore ?? 0;
    const totalNegative: number = companyAvgSentiment._sum.negativeScore ?? 0;
    const avgSentiment: number =
      count > 0 ? (totalPositive - totalNegative) / count : 0;

    res.status(200).json({
      companyOverview: companyInfo,
      avgSentiment: Number(avgSentiment.toFixed(3)),
    });
  } catch (error: any) {
    logger.error("There was an error in fetching company overview details", {
      id: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      error: "There was an error in fetching company overview details",
    });
  }
};

export const getSectorSentimentTrends = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.params;
    const idAsNumber = parseInt(sectorId, 10);

    // --- 1. VALIDATE sectorId ---
    if (isNaN(idAsNumber)) {
      logger.error("Invalid Sector ID provided", { sectorId });
      res.status(400).json({ error: "Invalid Sector ID" });
      return;
    }

    // --- 2. VALIDATE query param ---
    const { infoRangeType: range } = req.query;
    if (range !== "weekly" && range !== "monthly") {
      logger.error(
        "Invalid or missing 'infoRangeType'. Must be 'weekly' or 'monthly'"
      );
      res.status(400).json({
        error:
          "Invalid or missing 'infoRangeType'. Must be 'weekly' or 'monthly'.",
      });
      return;
    }

    // --- 3. Set up dynamic SQL parts (now that input is safe) ---
    const rangeUnit =
      range === "weekly" ? Prisma.raw("'week'") : Prisma.raw("'month'");
    const interval =
      range === "weekly" ? Prisma.raw("'4 weeks'") : Prisma.raw("'4 months'");
    const movingAvgWindow = 3; // 3 PRECEDING + 1 CURRENT = 4 periods

    const sentimentQuery = await prisma.$queryRaw<CompanySentimentRow[]>(
      Prisma.sql`
        -- CTE 1: Get relevant companies for the requested sector
        WITH "SectorCompanies" AS (
          SELECT "id", "name" FROM "Startups" WHERE "sectorId" = ${idAsNumber}
        ),

        -- CTE 2: Calculate the "spiky" average for each bucket for *those* companies
        "BucketAverages" AS (
          SELECT
            T1."startupId" AS "companyId",
            T2."name" AS "companyName",
            DATE_TRUNC(${rangeUnit}, T3."publishedAt") AS "time_bucket",
            SUM(
              CASE 
                WHEN T1."sentiment" != 'neutral' 
                THEN COALESCE(T1."positiveScore", 0) - COALESCE(T1."negativeScore", 0) 
                ELSE 0 
              END
            ) / 
            NULLIF(
              COUNT(
                CASE WHEN T1."sentiment" != 'neutral' 
                THEN T1."id"
                ELSE null
              END), 0
            ) AS "avgSentiment"
          FROM "ArticlesSentiment" AS T1
          JOIN "SectorCompanies" AS T2 ON T1."startupId" = T2."id" -- <-- THIS NOW CORRECTLY FILTERS BY SECTOR
          JOIN "Articles" AS T3 ON T1."articleId" = T3."id"
          WHERE
            T3."publishedAt" >= (DATE_TRUNC(${rangeUnit}, NOW()) - INTERVAL ${interval})
          GROUP BY
            T1."startupId",
            T2."name",
            "time_bucket"
        )
        -- CTE 3: Apply the moving average over the "spiky" data
        SELECT
          "companyId",
          "companyName",
          "time_bucket",
          "avgSentiment", -- We keep this just for logging
          
          -- This is the new "smooth" line
          AVG("avgSentiment") OVER (
            PARTITION BY "companyName" -- Calculate separately for each company
            ORDER BY "time_bucket"     -- In chronological order
            ROWS BETWEEN ${movingAvgWindow} PRECEDING AND CURRENT ROW -- 4-period moving average
          ) AS "movingAvgSentiment"
          
        FROM "BucketAverages"
        ORDER BY
          "time_bucket",
          "companyName";
      `
    );

    // --- 5. Transform the flat data into a grouped structure ---
    // (This part is unchanged and remains correct)
    const companyMap = new Map<string, GroupedSentimentResponse>();
    for (const row of sentimentQuery) {
      if (!companyMap.has(row.companyId)) {
        companyMap.set(row.companyId, {
          companyId: row.companyId,
          companyName: row.companyName,
          stats: [],
        });
      }

      companyMap.get(row.companyId)!.stats.push({
        time_bucket: row.time_bucket,
        avgSentiment:
          row.movingAvgSentiment === null // <-- Use the smooth value
            ? 0
            : Math.round(row.movingAvgSentiment * 1000) / 1000,
      });
    }
    const groupedResponse:GroupedSentimentResponse[] = Array.from(companyMap.values());
    res.status(200).json({
      sentiments: groupedResponse,
    });
  } catch (error: any) {
    logger.error("There was an error in fetching sector sentiment trends", {
      // id: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      error: "There was an error in fetching sector sentiment trends",
    });
  }
};