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
exports.getPaginatedNews = exports.getPaginatedCompanies = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const client_1 = require("@prisma/client");
// Define a type for the result to improve type safety
const getPaginatedCompanies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Assuming 'searchQueryType' is defined elsewhere
    const { sentiment, industry, sentimentScoreLimit, page, limit, searchQuery } = req.query;
    const pageNumber = page ? Number(page) : 1;
    const itemsLength = limit ? Number(limit) : 10;
    // CRITICAL FIX: The offset calculation was incorrect. It should be (page - 1) * limit.
    const offset = (pageNumber - 1) * itemsLength;
    const conditions = [];
    if (searchQuery) {
        conditions.push(client_1.Prisma.sql `s.name ILIKE ${`%${searchQuery}%`}`);
    }
    if (industry) {
        conditions.push(client_1.Prisma.sql `sec.name ILIKE ${`%${industry}%`}`);
    }
    if (sentimentScoreLimit !== undefined) {
        conditions.push(client_1.Prisma.sql `coalesce(st.avg_sentiment_score,0) >= -1`);
    }
    if (sentiment) {
        if (sentiment === "positive")
            conditions.push(client_1.Prisma.sql `st.avg_sentiment_score > .01`);
        if (sentiment === "negative")
            conditions.push(client_1.Prisma.sql `st.avg_sentiment_score < -0.01`);
        // A slightly cleaner way to write the neutral condition
        if (sentiment === "neutral")
            conditions.push(client_1.Prisma.sql `st.avg_sentiment_score BETWEEN -0.01 AND 0.01`);
    }
    const whereClause = conditions.length > 0
        ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(conditions, " AND ")}`
        : "";
    try {
        // 1. Your original query for the page's data
        const results = yield prisma_1.prisma.$queryRaw `
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
        const countResult = yield prisma_1.prisma.$queryRaw `
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
        const totalCount = Number(countResult[0].totalCount);
        res.status(200).json({
            startups: results,
            meta: {
                total: Number(totalCount),
                page: pageNumber,
                limit: itemsLength,
                totalPages: Math.ceil(Number(totalCount) / itemsLength),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error in fetching the dashboard Stats", {
            //   id: req.user.id,
            error: error.message,
        });
        res
            .status(500)
            .json({ error: "This was a server error in fetching stats" });
    }
});
exports.getPaginatedCompanies = getPaginatedCompanies;
const getPaginatedNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sentiment, industry, page, limit, searchQuery, companyId } = req.query;
    const pageNumber = page ? Number(page) : 1;
    const itemsLength = limit ? Number(limit) : 10;
    const offset = (pageNumber - 1) * itemsLength;
    const whereClause = Object.assign(Object.assign(Object.assign(Object.assign({}, (searchQuery && {
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
    })), (sentiment && {
        ArticlesSentiment: {
            some: {
                sentiment: sentiment,
            },
        },
    })), (industry && {
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
    })), (companyId &&
        companyId !== "" && {
        ArticlesSentiment: {
            some: {
                startupId: companyId,
            },
        },
    }));
    try {
        const pagiantedNewsData = yield prisma_1.prisma.articles.findMany({
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
            orderBy: {
                publishedAt: 'desc',
                createdAt: 'desc'
            }
        });
        const totalNewsItems = yield prisma_1.prisma.articles.count({
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
exports.getPaginatedNews = getPaginatedNews;
//# sourceMappingURL=searchController.js.map