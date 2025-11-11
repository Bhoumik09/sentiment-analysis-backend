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
exports.getSectorSentimentTrends = exports.companyInformation = exports.companySentimentInfo = void 0;
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
const getSectorSentimentTrends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sectorId } = req.params;
        const idAsNumber = parseInt(sectorId, 10);
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
        const rangeUnit = range === "weekly" ? client_1.Prisma.raw("'week'") : client_1.Prisma.raw("'month'");
        const interval = range === "weekly" ? client_1.Prisma.raw("'4 weeks'") : client_1.Prisma.raw("'4 months'");
        const movingAvgWindow = 3; // 3 PRECEDING + 1 CURRENT = 4 periods
        const sentimentQuery = yield prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
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
      `);
        // --- 5. Transform the flat data into a grouped structure ---
        // (This part is unchanged and remains correct)
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
                avgSentiment: row.movingAvgSentiment === null // <-- Use the smooth value
                    ? 0
                    : Math.round(row.movingAvgSentiment * 1000) / 1000,
            });
        }
        const groupedResponse = Array.from(companyMap.values());
        res.status(200).json({
            sentiments: groupedResponse,
        });
    }
    catch (error) {
        logger_1.default.error("There was an error in fetching sector sentiment trends", {
            // id: req.user?.id,
            error: error.message,
        });
        res.status(500).json({
            error: "There was an error in fetching sector sentiment trends",
        });
    }
});
exports.getSectorSentimentTrends = getSectorSentimentTrends;
//# sourceMappingURL=companyAnalysisController.js.map