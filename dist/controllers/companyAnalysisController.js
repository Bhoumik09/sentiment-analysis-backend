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
exports.companyAnalysisTrend = exports.sentimentTrendOverPeriod = exports.getSectorSentimentTrends = exports.companyInformation = exports.companySentimentInfo = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const client_1 = require("@prisma/client");
const companySentimentInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { companyId } = req.params;
        const sentimentStats = (yield prisma_1.prisma.articlesSentiment.groupBy({
            by: ["sentiment"],
            where: {
                startupId: companyId,
            },
            _count: {
                articleId: true,
            },
        }));
        const formattedResults = sentimentStats.map((sentiment) => ({
            sentiment: sentiment.sentiment,
            sentimentCount: sentiment._count.articleId,
        }));
        res.status(200).json({ sentimentStats: formattedResults });
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
    var _a, _b, _c;
    try {
        const id = req.params;
        const companyId = id.companyId;
        const companyInfoQuery = prisma_1.prisma.startups.findUnique({
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
        const companyAvgSentimentQuery = prisma_1.prisma.articlesSentiment.aggregate({
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
        const neutralCountQuery = prisma_1.prisma.articlesSentiment.count({
            where: {
                startupId: companyId,
                sentiment: "neutral", // Filter for neutral here
            },
        });
        const [companyInfo, companyAvgSentiment, neutralCount] = yield Promise.all([
            companyInfoQuery,
            companyAvgSentimentQuery,
            neutralCountQuery,
        ]);
        const count = companyAvgSentiment._count._all - neutralCount;
        const totalPositive = (_a = companyAvgSentiment._sum.positiveScore) !== null && _a !== void 0 ? _a : 0;
        const totalNegative = (_b = companyAvgSentiment._sum.negativeScore) !== null && _b !== void 0 ? _b : 0;
        const avgSentiment = count > 0 ? (totalPositive - totalNegative) / count : 0;
        res.status(200).json({
            companyOverview: companyInfo,
            avgSentiment: Number(avgSentiment.toFixed(3)),
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching company overview details", {
            id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching company overview details",
        });
    }
});
exports.companyInformation = companyInformation;
// Helper to round results
const roundSentiment = (sentiments) => {
    return sentiments.map((item) => (Object.assign(Object.assign({}, item), { avgSentiment: item.avgSentiment === null
            ? 0 // Default to 0 if no articles
            : Math.round(item.avgSentiment * 1000) / 1000 })));
};
const getSectorSentimentTrends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { sectorId } = req.params;
        const idAsNumber = parseInt(sectorId, 10);
        console.log(idAsNumber);
        // --- 1. VALIDATE sectorId ---
        if (isNaN(idAsNumber)) {
            logger_1.default.error("Invalid Sector ID provided", { sectorId });
            res.status(400).json({ error: "Invalid Sector ID" });
            return;
        }
        // --- 2. VALIDATE query param ---
        const { infoRangeType: range } = req.query;
        if (range !== "weekly" && range !== "monthly") {
            logger_1.default.error("Invalid or missing 'infoRangeType'. Must be 'weekly' or 'monthly'");
            res.status(400).json({
                error: "Invalid or missing 'infoRangeType'. Must be 'weekly' or 'monthly'.",
            });
            return;
        }
        // --- 3. Set up dynamic SQL parts (now that input is safe) ---
        const rangeUnit = range === "weekly" ? client_1.Prisma.raw("week") : client_1.Prisma.raw("month");
        const interval = range === "weekly" ? client_1.Prisma.raw("'4 weeks'") : client_1.Prisma.raw("'4 months'");
        // --- 4. Run the Corrected Query ---
        const sentimentQuery = yield prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
        -- CTE to get relevant companies and their names
        WITH "SectorCompanies" AS (
          SELECT "id", "name" FROM "Startups" WHERE "sectorId" = ${idAsNumber}
        )
        SELECT
          T1."startupId" AS "companyId",
          T2."name" AS "companyName",
          DATE_TRUNC('month', T3."publishedAt") AS "time_bucket",
          (
            SUM(COALESCE(T1."positiveScore", 0)) - SUM(COALESCE(T1."negativeScore", 0))
          ) / NULLIF(COUNT(T1."id"), 0) AS "avgSentiment"
        FROM "ArticlesSentiment" AS T1
        JOIN "SectorCompanies" AS T2 ON T1."startupId" = T2."id"
        JOIN "Articles" AS T3 ON T1."articleId" = T3."id"
        WHERE
          T3."publishedAt" >= (DATE_TRUNC('month', NOW()) - INTERVAL ${interval})
        GROUP BY
          T1."startupId",
          T2."name",
          "time_bucket"
        ORDER BY
          "time_bucket",
          "companyName";
      `);
        console.log(sentimentQuery);
        // --- 5. Transform the flat data into a grouped structure ---
        const companyMap = new Map();
        for (const row of sentimentQuery) {
            if (!companyMap.has(row.companyId)) {
                companyMap.set(row.companyId, {
                    companyId: row.companyId,
                    companyName: row.companyName,
                    stats: [],
                });
            }
            companyMap.get(row.companyId).stats.push({
                time_bucket: row.time_bucket,
                avgSentiment: row.avgSentiment === null
                    ? 0
                    : Math.round(row.avgSentiment * 1000) / 1000,
            });
        }
        const groupedResponse = Array.from(companyMap.values());
        console.log(groupedResponse);
        // --- 6. Send Response ---
        res.status(200).json({
            sentiments: groupedResponse,
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching sector sentiment trends", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching sector sentiment trends",
        });
    }
});
exports.getSectorSentimentTrends = getSectorSentimentTrends;
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
    AND "publishedAt" >= date_trunc('month', CURRENT_DATE) - interval '6 months'
  GROUP BY
    month
  ORDER BY
    month DESC;
`;
        // const for
        res.status(200).json({
            companyStats: monthlyCounts,
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