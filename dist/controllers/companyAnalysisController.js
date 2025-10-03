"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyAnalysisTrend = exports.recentNewsOfCompany = exports.sentimentTrendOverPeriod = exports.companyInformation = exports.companySentimentInfo = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const companySentimentInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const companyInfo = yield prisma_1.prisma.$queryRaw `
        
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
        console.log(companyInfo);
        const companyFinalObj = companyInfo.map((info) => (Object.assign(Object.assign({}, info), { totalArticles: Number(info.totalArticles), positiveCount: Number(info.positiveCount), negativeCount: Number(info.negativeCount), neutralCount: Number(info.neutralCount) })))[0];
        // const for
        res.status(200).json({
            companyInfo: companyFinalObj,
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company's details", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company's details",
        });
    }
});
exports.companySentimentInfo = companySentimentInfo;
const companyInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const companyInfo = yield prisma_1.prisma.startups.findUnique({
            where: {
                id: companyId,
            },
            omit: {
                createdAt: true,
                findingKeywords: true,
            },
        });
        // const for
        console.log(companyInfo);
        res.status(200).json({
            companyOverview: companyInfo,
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company overview details", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company overview details",
        });
    }
});
exports.companyInformation = companyInformation;
const sentimentTrendOverPeriod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const companyInfo = yield prisma_1.prisma.$queryRaw `
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
            companyOverview: companyInfo.map((info) => (Object.assign(Object.assign({}, info), { current_month: Number(info.current_month), previous_month: Number(info.previous_month), twoMonthsEarlier: Number(info.twoMonthsEarlier), threeMonthsEarlier: Number(info.threeMonthsEarlier), fourMonthsEarlier: Number(info.fourMonthsEarlier), fiveMonthsEarlier: Number(info.fiveMonthsEarlier) })))[0],
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company overview details", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company overview details",
        });
    }
});
exports.sentimentTrendOverPeriod = sentimentTrendOverPeriod;
const recentNewsOfCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const companyInfo = yield prisma_1.prisma.articles.findMany({
            where: {
                startupId: companyId
            },
            orderBy: {
                publishedAt: "desc"
            },
            take: 5,
            select: {
                title: true,
                url: true,
                content: true,
                publishedAt: true,
                sentimentScores: true,
                sentiment: true
            }
        });
        // const for
        res.status(200).json({
            recentNews: companyInfo
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company's recent news", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company's recent news",
        });
    }
});
exports.recentNewsOfCompany = recentNewsOfCompany;
const companyAnalysisTrend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const monthlyCounts = yield prisma_1.prisma.$queryRaw `
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
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company's recent news", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company's recent news",
        });
    }
});
exports.companyAnalysisTrend = companyAnalysisTrend;
//# sourceMappingURL=companyAnalysisController.js.map