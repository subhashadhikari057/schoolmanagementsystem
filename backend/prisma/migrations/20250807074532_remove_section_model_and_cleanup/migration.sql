/*
  Warnings:

  - You are about to drop the column `sectionId` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_classId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClass" DROP CONSTRAINT "TeacherClass_sectionId_fkey";

-- AlterTable
ALTER TABLE "TeacherClass" DROP COLUMN "sectionId";

-- DropTable
DROP TABLE "Section";
