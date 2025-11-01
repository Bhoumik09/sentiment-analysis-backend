/*
  Warnings:

  - You are about to drop the column `sentimentScore` on the `ArticlesSentiment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ArticlesSentiment" DROP COLUMN "sentimentScore",
ADD COLUMN     "negativeScore" DOUBLE PRECISION,
ADD COLUMN     "neutralScore" DOUBLE PRECISION,
ADD COLUMN     "positiveScore" DOUBLE PRECISION;
