import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import { sentimentTrendAvg,companyNewsData } from "../types/all";
export interface companyInfo {
  positiveCount: bigint;
  negativeCount: bigint;
  neutralCount: bigint;
  totalArticles: bigint;
  averageSentimentScore:number;
}
export const companySentimentInfo = async (req: Request, res: Response) => {
  try {
    const id = req.params as { companyId: string };
    const companyId = id.companyId;
    const companyInfo = await prisma.$queryRaw<companyInfo[]>`
        
 with companyArticlesInfo AS (
    SELECT 
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)*1 AS "positiveCount",
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)*1 AS "negativeCount",
        COUNT(CASE WHEN sentiment = 'neutral'  THEN 1 END)*1 AS "neutralCount",
        count(*)*1 AS "totalArticles",
        avg("sentimentScores") AS "averageSentimentScore"
    FROM 
        "Articles" 
    WHERE 
        "startupId" = ${companyId}
)
SELECT 
   *
FROM 
    companyArticlesInfo AS ca;
    `;
    console.log(companyInfo)
    const companyFinalObj = companyInfo.map((info) => ({
      ...info,
      totalArticles: Number(info.totalArticles),
      positiveCount: Number(info.positiveCount),
      negativeCount: Number(info.negativeCount),
      neutralCount: Number(info.neutralCount),
    }))[0];
    // const for
    res.status(200).json({
      companyInfo: companyFinalObj,
    });
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

export const companyInformation = async (req: Request, res: Response) => {
  try {
    const id = req.params as { companyId: string };
    const companyId = id.companyId;

    const companyInfo: {
      id: string;
      name: string;
      sector: string;
      description: string | null;
    } | null = await prisma.startups.findUnique({
      where: {
        id: companyId,
      },
      omit: {
        createdAt: true,
        findingKeywords: true,
      },
    });

    // const for
    console.log(companyInfo)
    res.status(200).json({
      companyOverview: companyInfo,
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

export const recentNewsOfCompany = async (req: Request, res: Response) => {
  try {
    const id = req.params as { companyId: string };
    const companyId = id.companyId;

    const companyInfo:{
      title:string,
      url:string|null,
      content:string,
      publishedAt:Date,
      sentimentScores:number|null,
      sentiment:string
    }[] = await prisma.articles.findMany({
      where:{
        startupId:companyId
      },
      orderBy:{
        publishedAt:"desc"
      },
      take:5, 
      select:{
        title:true,
        url:true,
        content:true,
        publishedAt:true,
        sentimentScores:true,
        sentiment:true
      }
    })

    // const for
    res.status(200).json({
        recentNews: companyInfo
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
        companyStats: monthlyCounts
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

