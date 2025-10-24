-- AlterTable
ALTER TABLE "ArticlesSentiment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sentiment" TEXT,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION;
