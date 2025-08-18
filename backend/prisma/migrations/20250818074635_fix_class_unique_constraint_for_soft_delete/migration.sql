/*
  Warnings:

  - A unique constraint covering the columns `[grade,section,shift,deletedAt]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Class_grade_section_shift_key";

-- CreateIndex
CREATE UNIQUE INDEX "Class_grade_section_shift_deletedAt_key" ON "public"."Class"("grade", "section", "shift", "deletedAt");
