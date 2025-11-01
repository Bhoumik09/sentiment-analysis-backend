/*
  Warnings:

  - You are about to drop the column `sector` on the `Startups` table. All the data in the column will be lost.
  - Added the required column `sectorId` to the `Startups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Articles" ALTER COLUMN "content" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "Startups" DROP COLUMN "sector",
ADD COLUMN     "sectorId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Sector" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Startups" ADD CONSTRAINT "Startups_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
