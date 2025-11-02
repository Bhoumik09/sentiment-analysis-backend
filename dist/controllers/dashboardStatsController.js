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
exports.TrendingStartups = exports.dashBoardAnalytics = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const dashBoardAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //get startup count
    try {
        const totalStartups = yield prisma_1.prisma.startups.count();
        //get articles count based on sentiment
        const totalArticles = yield prisma_1.prisma.$queryRaw `SELECT
  COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)*1 as "Positive",
  COUNT(CASE WHEN sentiment = 'negative' THEN 1 END)*1 as "Negative",
  COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END)*1 as "Neutral",
  count(*) as "totalArticles"
FROM "ArticlesSentiment";`;
        console.log(totalArticles);
        const statusGrouping = totalArticles.map((articles) => ({
            postiveCount: Number(articles.Positive),
            negativeCount: Number(articles.Negative),
            neutralCount: Number(articles.Neutral),
            totalCount: Number(articles.totalArticles),
        }))[0];
        //compare total startup count to last month
        const monthCompare = yield prisma_1.prisma.$queryRaw `
    SELECT
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW())) AS "currentMonthCount",
    COUNT(*) FILTER (WHERE date_trunc('month', "createdAt") <= date_trunc('month', NOW() - interval '1 month')) AS "previousMonthCount"
    FROM "Startups";
    `;
        const monthIncDecStats = Number(monthCompare[0].currentMonthCount) -
            Number(monthCompare[0].previousMonthCount);
        console.log(monthIncDecStats);
        //get previous and current week trends for comparison
        const articlesWeeklyStats = yield prisma_1.prisma.$queryRaw `
      SELECT
        COUNT(*) FILTER (WHERE als.sentiment = 'positive' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW())) AS "currentWeekPositive",
        COUNT(*) FILTER (WHERE als.sentiment = 'negative' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW())) AS "currentWeekNegative",
        COUNT(*) FILTER (WHERE als.sentiment = 'positive' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekPositive",
        COUNT(*) FILTER (WHERE als.sentiment = 'negative' AND date_trunc('week', a."publishedAt") <= date_trunc('week', NOW() - interval '1 week')) AS "previousWeekNegative",
        AVG(als."positiveScore"-als."negativeScore") AS "avg_sentiment"
      FROM "Articles" as a inner join "ArticlesSentiment" as als
      ON a.id = als."articleId"
    `;
        console.log(articlesWeeklyStats);
        const positiveTrendArticles = ((Number(articlesWeeklyStats[0].currentWeekPositive) -
            Number(articlesWeeklyStats[0].previousWeekPositive)) *
            100) /
            (Number(articlesWeeklyStats[0].previousWeekPositive) === 0
                ? 1
                : Number(articlesWeeklyStats[0].previousWeekPositive));
        const negativeTrendArticles = ((Number(articlesWeeklyStats[0].currentWeekNegative) -
            Number(articlesWeeklyStats[0].previousWeekNegative)) *
            100) /
            (Number(articlesWeeklyStats[0].previousWeekNegative) === 0
                ? 1
                : Number(articlesWeeklyStats[0].previousWeekNegative));
        const neutralTrendArticles = Number(articlesWeeklyStats[0].avg_sentiment);
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
    }
    catch (e) {
        logger_1.default.error("Error in fetching the dashboard Analytics", {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            error: e.message,
        });
        res
            .status(500)
            .json({ error: "This was a server error in fetching stats" });
    }
});
exports.dashBoardAnalytics = dashBoardAnalytics;
const TrendingStartups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    //get 4 startups with more articles in the present week
    try {
        const trendingStartups = yield prisma_1.prisma.$queryRawUnsafe(`
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
            logger_1.default.error("Error in fetching the dashboard Analytics", {
                id: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id,
                error: "Unable to fetch dashboard analytics due to sql query error",
            });
            res
                .status(404)
                .json({ error: "This was a server error in fetching stats" });
        }
        // The result might contain BigInt for counts, convert them if necessary
        const formattedResults = trendingStartups.map((startup) => ({
            id: startup.id,
            name: startup.name,
            currentWeekArticleCount: Number(startup.current_week_article_count),
            // Round the average sentiment for cleaner display
            current_sentiment: parseFloat(startup.overall_avg_sentiment.toFixed(3)),
        }));
        res.status(200).json({ trendingStartups: formattedResults });
    }
    catch (e) {
        logger_1.default.error("Error in fetching the dashboard Analytics", {
            id: (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.id,
            error: e.message,
        });
        res
            .status(500)
            .json({ error: "This was a server error in fetching stats" });
    }
});
exports.TrendingStartups = TrendingStartups;
//# sourceMappingURL=dashboardStatsController.js.map