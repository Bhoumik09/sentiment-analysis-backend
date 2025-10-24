/*
  Warnings:

  - You are about to drop the column `sentiment` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `sentimentScores` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `startupId` on the `Articles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Articles" DROP CONSTRAINT "Articles_startupId_fkey";

-- AlterTable
ALTER TABLE "Articles" DROP COLUMN "sentiment",
DROP COLUMN "sentimentScores",
DROP COLUMN "startupId";

-- DropEnum
DROP TYPE "public"."sentimentTypes";

-- CreateTable
CREATE TABLE "ArticlesSentiment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,

    CONSTRAINT "ArticlesSentiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticlesSentiment_articleId_startupId_key" ON "ArticlesSentiment"("articleId", "startupId");

-- AddForeignKey
ALTER TABLE "ArticlesSentiment" ADD CONSTRAINT "ArticlesSentiment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticlesSentiment" ADD CONSTRAINT "ArticlesSentiment_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
