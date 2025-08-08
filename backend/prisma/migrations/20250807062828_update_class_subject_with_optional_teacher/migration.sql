/*
  Warnings:

  - A unique constraint covering the columns `[classId,subjectId]` on the table `ClassSubject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ClassSubject" DROP CONSTRAINT "ClassSubject_teacherId_fkey";

-- AlterTable
ALTER TABLE "ClassSubject" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" UUID,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ClassSubject_createdById_idx" ON "ClassSubject"("createdById");

-- CreateIndex
CREATE INDEX "ClassSubject_updatedById_idx" ON "ClassSubject"("updatedById");

-- CreateIndex
CREATE INDEX "ClassSubject_deletedById_idx" ON "ClassSubject"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
