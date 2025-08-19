/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `ParentStudentLink` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ParentStudentLink" DROP COLUMN "contactEmail",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone";
