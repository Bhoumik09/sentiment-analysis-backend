
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
    
    where s.name ILIKE $1 and s.sector ILIKE $2 and stats.avg_sentiment_score >= $3
    and stats.avg_sentiment_score <= $4

    ORDER BY a1."publishedAt" DESC
    LIMIT $2
    OFFSET $3