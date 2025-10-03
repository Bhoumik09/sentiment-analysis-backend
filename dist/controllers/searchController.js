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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Assuming 'searchQueryType' is defined elsewhere
    const { sentiment, industry, sentimentScoreLimit, page, limit, searchQuery } = req.query;
    const pageNumber = page ? Number(page) : 1;
    const itemsLength = limit ? Number(limit) : 10;
    // CRITICAL FIX: The offset calculation was incorrect. It should be (page - 1) * limit.
    const offset = (pageNumber - 1) * itemsLength;
    console.log(sentimentScoreLimit);
    const conditions = [];
    if (searchQuery) {
        conditions.push(prisma_1.Prisma.sql `s.name ILIKE ${`%${searchQuery}%`}`);
    }
    if (industry) {
        conditions.push(prisma_1.Prisma.sql `s.sector ILIKE ${`%${industry}%`}`);
    }
    if (sentimentScoreLimit !== undefined) {
        conditions.push(prisma_1.Prisma.sql `stats.avg_sentiment_score >= ${Number(sentimentScoreLimit)}`);
    }
    if (sentiment) {
        if (sentiment === "positive")
            conditions.push(prisma_1.Prisma.sql `stats.avg_sentiment_score > .01`);
        if (sentiment === "negative")
            conditions.push(prisma_1.Prisma.sql `stats.avg_sentiment_score < -0.01`);
        // A slightly cleaner way to write the neutral condition
        if (sentiment === "neutral")
            conditions.push(prisma_1.Prisma.sql `stats.avg_sentiment_score BETWEEN -0.01 AND 0.01`);
    }
    const whereClause = conditions.length > 0
        ? prisma_1.Prisma.sql `WHERE ${prisma_1.Prisma.join(conditions, " AND ")}`
        : "";
    try {
        // --- The Single, Optimized Query ---
        const results = yield prisma_1.prisma.$queryRaw `
    WITH StartupStats AS (
      SELECT
        "startupId",
        COUNT(*) AS total_articles,
        AVG("sentimentScores") AS avg_sentiment_score
      FROM "Articles"
      GROUP BY "startupId"
    ),
    -- 1. MODIFIED CTE: Rank all articles and limit to 3 per startup (optional, but cleaner)
    RankedArticles AS (
      SELECT
        id, title, url, content, "publishedAt", "startupId","sentimentScores", sentiment,
        ROW_NUMBER() OVER(PARTITION BY "startupId" ORDER BY "publishedAt" DESC) as rn
      FROM "Articles"
    )
    SELECT
      s.id,
      s.name,
      s.sector,
      stats.total_articles,
      stats.avg_sentiment_score,
      -- 2. NEW COLUMNS: Select the latest articles separately
      a1.title AS latest_article_1_title,
      a1.url AS latest_article_1_url,
      a1.content AS latest_article_1_content,
      a1."publishedAt" AS latest_article_1_published_at,
      a1."sentimentScores" AS latest_article_1_sentiment_score,
      a1.sentiment AS latest_article_1_sentiment,

      a2.title AS latest_article_2_title,
      a2.url AS latest_article_2_url,
      a2.content AS latest_article_2_content,
      a2."publishedAt" AS latest_article_2_published_at,
      a2."sentimentScores" AS latest_article_2_sentiment_score,
      a2.sentiment AS latest_article_2_sentiment,
      
      a3.title AS latest_article_3_title,
      a3.url AS latest_article_3_url,
      a3.content AS latest_article_3_content,
      a3."publishedAt" AS latest_article_3_published_at,
      a3."sentimentScores" AS latest_article_3_sentiment_score,
      a3.sentiment AS latest_article_3_sentiment,

      -- Get the total count before pagination
      COUNT(s.id) OVER() as total_count
    FROM "Startups" s
    LEFT JOIN StartupStats stats ON s.id = stats."startupId"
    
    -- 3. KEY MODIFICATION: Join RankedArticles three times for rn = 1, 2, and 3
    LEFT JOIN RankedArticles a1 ON s.id = a1."startupId" AND a1.rn = 1
    LEFT JOIN RankedArticles a2 ON s.id = a2."startupId" AND a2.rn = 2
    LEFT JOIN RankedArticles a3 ON s.id = a3."startupId" AND a3.rn = 3
    
    ${whereClause}
    ORDER BY a1."publishedAt" DESC
    LIMIT ${itemsLength}
    OFFSET ${offset}
  `;
        // Extract the total count from the first result row. If no results, count is 0.
        const formattedResults = results.map((_a) => {
            var { latest_article_1_content, latest_article_1_published_at, latest_article_1_title, latest_article_1_url, latest_article_2_content, latest_article_2_published_at, latest_article_2_title, latest_article_2_url, latest_article_3_content, latest_article_3_published_at, latest_article_3_title, latest_article_3_url } = _a, result = __rest(_a, ["latest_article_1_content", "latest_article_1_published_at", "latest_article_1_title", "latest_article_1_url", "latest_article_2_content", "latest_article_2_published_at", "latest_article_2_title", "latest_article_2_url", "latest_article_3_content", "latest_article_3_published_at", "latest_article_3_title", "latest_article_3_url"]);
            return (Object.assign(Object.assign({}, result), { latestArticles: [
                    {
                        title: latest_article_1_title,
                        url: latest_article_1_url,
                        content: latest_article_1_content,
                        publishedAt: latest_article_1_published_at,
                        sentimentScore: result.latest_article_1_sentiment_score,
                        sentiment: result.latest_article_1_sentiment,
                    },
                    {
                        title: latest_article_2_title,
                        url: latest_article_2_url,
                        content: latest_article_2_content,
                        publishedAt: latest_article_2_published_at,
                        sentimentScore: result.latest_article_2_sentiment_score,
                        sentiment: result.latest_article_2_sentiment,
                    },
                    {
                        title: latest_article_3_title,
                        url: latest_article_3_url,
                        content: latest_article_3_content,
                        publishedAt: latest_article_3_published_at,
                        sentimentScore: result.latest_article_3_sentiment_score,
                        sentiment: result.latest_article_3_sentiment,
                    },
                ] }));
        });
        const totalCount = formattedResults.length > 0 ? Number(results[0].total_count) : 0;
        // const top2Articles=[{title:results}]
        // We need to remove the 'total_count' property from the final data sent to the client.
        const startups = formattedResults.map((_a) => {
            var { total_count, total_articles } = _a, rest = __rest(_a, ["total_count", "total_articles"]);
            return (Object.assign(Object.assign({}, rest), { total_articles: total_articles ? Number(total_articles) : null }));
        });
        res.status(200).json({
            startups: startups,
            meta: {
                total: totalCount,
                page: pageNumber,
                limit: itemsLength,
                totalPages: Math.ceil(totalCount / itemsLength),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error in fetching the dashboard Analytics", {
            //   id: req.user.id,
            error: error.message,
        });
        res
            .status(500)
            .json({ error: "This was a server error in fetching stats" });
    }
});
exports.search = search;
//# sourceMappingURL=searchController.js.map