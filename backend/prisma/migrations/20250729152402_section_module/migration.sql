/*
  Warnings:

  - You are about to drop the column `section` on the `Class` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teacherId,classId,sectionId]` on the table `TeacherClass` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Class_section_idx";

-- DropIndex
DROP INDEX "TeacherClass_teacherId_classId_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "section";

-- AlterTable
ALTER TABLE "TeacherClass" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "Section"("classId");

-- CreateIndex
CREATE INDEX "Section_createdById_idx" ON "Section"("createdById");

-- CreateIndex
CREATE INDEX "Section_updatedById_idx" ON "Section"("updatedById");

-- CreateIndex
CREATE INDEX "Section_deletedById_idx" ON "Section"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_classId_key" ON "Section"("name", "classId");

-- CreateIndex
CREATE INDEX "Class_createdById_idx" ON "Class"("createdById");

-- CreateIndex
CREATE INDEX "Class_updatedById_idx" ON "Class"("updatedById");

-- CreateIndex
CREATE INDEX "Class_deletedById_idx" ON "Class"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherClass_sectionId_idx" ON "TeacherClass"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClass_teacherId_classId_sectionId_key" ON "TeacherClass"("teacherId", "classId", "sectionId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
