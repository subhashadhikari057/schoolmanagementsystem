/*
  Warnings:

  - A unique constraint covering the columns `[grade,section,shift]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - Made the column `classTeacherId` on table `Class` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."ClassShift" AS ENUM ('MORNING', 'DAY');

-- DropForeignKey
ALTER TABLE "public"."Class" DROP CONSTRAINT "Class_classTeacherId_fkey";

-- First, assign a default teacher to any classes without a classTeacherId
-- We'll use the first available teacher as a temporary assignment
UPDATE "public"."Class" 
SET "classTeacherId" = (
  SELECT "id" FROM "public"."Teacher" 
  WHERE "deletedAt" IS NULL 
  LIMIT 1
)
WHERE "classTeacherId" IS NULL;

-- AlterTable
ALTER TABLE "public"."Class" ADD COLUMN     "name" TEXT,
ADD COLUMN     "shift" "public"."ClassShift" NOT NULL DEFAULT 'MORNING',
ALTER COLUMN "classTeacherId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Class_grade_idx" ON "public"."Class"("grade");

-- CreateIndex
CREATE INDEX "Class_section_idx" ON "public"."Class"("section");

-- CreateIndex
CREATE INDEX "Class_shift_idx" ON "public"."Class"("shift");

-- CreateIndex
CREATE UNIQUE INDEX "Class_grade_section_shift_key" ON "public"."Class"("grade", "section", "shift");

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "public"."Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
