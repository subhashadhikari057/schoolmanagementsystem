/*
  Warnings:

  - The `createdById` column on the `TeacherSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updatedById` column on the `TeacherSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deletedById` column on the `TeacherSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."TeacherSalaryHistory" DROP COLUMN "createdById",
ADD COLUMN     "createdById" UUID,
DROP COLUMN "updatedById",
ADD COLUMN     "updatedById" UUID,
DROP COLUMN "deletedById",
ADD COLUMN     "deletedById" UUID;

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_createdById_idx" ON "public"."TeacherSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_updatedById_idx" ON "public"."TeacherSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_deletedById_idx" ON "public"."TeacherSalaryHistory"("deletedById");
