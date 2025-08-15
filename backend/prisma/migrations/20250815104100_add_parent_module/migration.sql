/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `ParentStudentLink` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentId,studentId]` on the table `ParentStudentLink` will be added. If there are existing duplicate values, this will fail.
  - Made the column `parentId` on table `ParentStudentLink` required. This step will fail if there are existing NULL values in that column.
  - Made the column `relationship` on table `ParentStudentLink` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ParentStudentLink" DROP CONSTRAINT "ParentStudentLink_parentId_fkey";

-- AlterTable
ALTER TABLE "ParentStudentLink" DROP COLUMN "contactEmail",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "parentId" SET NOT NULL,
ALTER COLUMN "relationship" SET NOT NULL;

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "occupation" TEXT,
    "workPlace" TEXT,
    "workPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "socialLinks" JSONB DEFAULT '{}',
    "additionalData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_createdById_idx" ON "Parent"("createdById");

-- CreateIndex
CREATE INDEX "Parent_updatedById_idx" ON "Parent"("updatedById");

-- CreateIndex
CREATE INDEX "Parent_deletedById_idx" ON "Parent"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_parentId_key" ON "ParentProfile"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_parentId_idx" ON "ParentStudentLink"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_studentId_idx" ON "ParentStudentLink"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_parentId_studentId_key" ON "ParentStudentLink"("parentId", "studentId");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
