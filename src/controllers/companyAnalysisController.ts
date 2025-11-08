import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import { sentimentTrendAvg, companyNewsData } from "../types/all";
import { Prisma } from "@prisma/client";
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
    const [companyInfo, companyAvgSentiment] = await Promise.all([
      companyInfoQuery,
      companyAvgSentimentQuery,
    ]);
    const count: number = companyAvgSentiment._count._all ?? 0;
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

type CompanyTimeGroupedSentiment = {
  companyId: string;
  companyName: string;
  time_bucket: Date;
  avgSentiment: number | null;
};

// Helper to round results
const roundSentiment = (sentiments: CompanyTimeGroupedSentiment[]) => {
  return sentiments.map((item) => ({
    ...item,
    avgSentiment:
      item.avgSentiment === null
        ? 0 // Default to 0 if no articles
        : Math.round(item.avgSentiment * 1000) / 1000,
  }));
};


type CompanySentimentRow = {
  companyId: string;
  companyName: string;
  time_bucket: Date;
  avgSentiment: number | null;
};

// 2. The nested "stats" for each company
type SentimentStat = {
  time_bucket: Date;
  avgSentiment: number;
};

// 3. The final, grouped response structure
type GroupedSentimentResponse = {
  companyId: string;
  companyName: string;
  stats: SentimentStat[];
};

export const getSectorSentimentTrends = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.params;
    const idAsNumber = parseInt(sectorId, 10);

    // --- 1. VALIDATE sectorId ---
    if (isNaN(idAsNumber)) {
      return res.status(400).json({ error: 'Invalid Sector ID' });
    }

    // --- 2. VALIDATE query param ---
    const { infoRangeType: range } = req.query;
    if (range !== 'weekly' && range !== 'monthly') {
      return res.status(400).json({
        error: "Invalid or missing 'infoRangeType'. Must be 'weekly' or 'monthly'.",
      });
    }

    // --- 3. Set up dynamic SQL parts (now that input is safe) ---
    const rangeUnit = range === 'weekly' ? Prisma.raw("week") : Prisma.raw("month");
    const interval = range === 'weekly' ? Prisma.raw("'4 weeks'") : Prisma.raw("'4 months'");
    // --- 4. Run the Corrected Query ---
    const sentimentQuery = await prisma.$queryRaw<CompanySentimentRow[]>(
      Prisma.sql`
        -- CTE to get relevant companies and their names
        WITH "SectorCompanies" AS (
          SELECT "id", "name" FROM "Startups" WHERE "sectorId" = ${idAsNumber}
        )
        SELECT
          T1."startupId" AS "companyId",
          T2."name" AS "companyName",
          DATE_TRUNC('week', T3."publishedAt") AS "time_bucket",
          (
            SUM(COALESCE(T1."positiveScore", 0)) - SUM(COALESCE(T1."negativeScore", 0))
          ) / NULLIF(COUNT(T1."id"), 0) AS "avgSentiment"
        FROM "ArticlesSentiment" AS T1
        JOIN "SectorCompanies" AS T2 ON T1."startupId" = T2."id"
        JOIN "Articles" AS T3 ON T1."articleId" = T3."id"
        WHERE
          T3."publishedAt" >= (DATE_TRUNC('week', NOW()) - INTERVAL ${interval})
        GROUP BY
          T1."startupId",
          T2."name",
          "time_bucket"
        ORDER BY
          "time_bucket" DESC,
          "companyName";
      `
    );
    console.log(sentimentQuery)
    // --- 5. Transform the flat data into a grouped structure ---
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
          row.avgSentiment === null
            ? 0
            : Math.round(row.avgSentiment * 1000) / 1000,
      });
    }
    const groupedResponse = Array.from(companyMap.values());

    // --- 6. Send Response ---
    res.status(200).json({
      sentiments: groupedResponse,
    });
  } catch (error: any) {
    logger.error('There was an error in fetching sector sentiment trends', {
      id: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      error: 'There was an error in fetching sector sentiment trends',
    });
  }
};
export const sentimentTrendOverPeriod = async (req: Request, res: Response) => {
  try {
    const id = req.params as { companyId: string };
    const companyId = id.companyId;

    const companyInfo = await prisma.$queryRaw<sentimentTrendAvg[]>`
      select avg("sentimentScores") as current_month,
      coalesce(avg(case when "createdAt"<= date_trunc('month', CURRENT_DATE) - interval '1 month' then "sentimentScores" end),0) as "previous_month",
      coalesce(avg(case when "createdAt"<= date_trunc('month', CURRENT_DATE) - interval '2 month' then "sentimentScores" end),0) as "twoMonthsEarlier",
      coalesce(avg(case when "createdAt"<= date_trunc('month', CURRENT_DATE) - interval '3 month' then "sentimentScores" end),0) as "threeMonthsEarlier",
      coalesce(avg(case when "createdAt"<= date_trunc('month', CURRENT_DATE) - interval '4 month' then "sentimentScores" end),0) as "fourMonthsEarlier",
      coalesce(avg(case when "createdAt"<= date_trunc('month', CURRENT_DATE) - interval '5 month' then "sentimentScores" end),0) as "fiveMonthsEarlier"
      from "Articles" where "startupId"=${companyId};
    `;

    // const for
    res.status(200).json({
      companyOverview: companyInfo.map((info) => ({
        ...info,
        current_month: Number(info.current_month),
        previous_month: Number(info.previous_month),
        twoMonthsEarlier: Number(info.twoMonthsEarlier),
        threeMonthsEarlier: Number(info.threeMonthsEarlier),
        fourMonthsEarlier: Number(info.fourMonthsEarlier),
        fiveMonthsEarlier: Number(info.fiveMonthsEarlier),
      }))[0],
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

export const companyAnalysisTrend = async (req: Request, res: Response) => {
  try {
    const id = req.params as { companyId: string };
    const companyId = id.companyId;

    const monthlyCounts = await prisma.$queryRaw<companyNewsData[]>`
  SELECT
    date_trunc('month', "publishedAt")::date AS month,
    CAST(COUNT(*) AS INTEGER) AS "articleCount"
  FROM
    "Articles"
  WHERE
    "startupId" = ${companyId}
    AND "createdAt" >= date_trunc('month', CURRENT_DATE) - interval '6 months'
  GROUP BY
    month
  ORDER BY
    month DESC;
`;
    // const for
    res.status(200).json({
      companyStats: monthlyCounts,
    });
  } catch (error: any) {
    logger.error("There was an error in fetching company's recent news", {
      id: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      error: "There was an error in fetching company's recent news",
    });
  }
};
