/*
  Warnings:

  - You are about to drop the column `addressId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rollNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_addressId_fkey";

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "addressId",
ADD COLUMN     "academicStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "address" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "feeStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "maritalStatus" TEXT DEFAULT 'Single',
ADD COLUMN     "medicalConditions" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "specialNeeds" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "transportMode" TEXT,
ADD COLUMN     "updatedById" UUID;

-- DropTable
DROP TABLE "public"."Address";

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "public"."Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "public"."Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "public"."Student"("classId");

-- CreateIndex
CREATE INDEX "Student_rollNumber_idx" ON "public"."Student"("rollNumber");

-- CreateIndex
CREATE INDEX "Student_createdById_idx" ON "public"."Student"("createdById");

-- CreateIndex
CREATE INDEX "Student_updatedById_idx" ON "public"."Student"("updatedById");

-- CreateIndex
CREATE INDEX "Student_deletedById_idx" ON "public"."Student"("deletedById");

-- CreateIndex
CREATE INDEX "Student_academicStatus_idx" ON "public"."Student"("academicStatus");

-- CreateIndex
CREATE INDEX "Student_feeStatus_idx" ON "public"."Student"("feeStatus");
