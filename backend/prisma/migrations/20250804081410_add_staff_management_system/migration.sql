-- CreateEnum
CREATE TYPE "StaffEmploymentStatus" AS ENUM ('active', 'on_leave', 'resigned', 'terminated');

-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM ('administration', 'finance', 'hr', 'maintenance', 'security', 'library', 'canteen', 'transport', 'it_support', 'academic_support');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endpoint" TEXT,
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "statusCode" INTEGER,
ADD COLUMN     "traceId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "needPasswordChange" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "revokeReason" TEXT;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "qualification" TEXT,
    "employmentDate" TIMESTAMP(3),
    "employmentStatus" "StaffEmploymentStatus" NOT NULL DEFAULT 'active',
    "department" "StaffDepartment",
    "experienceYears" INTEGER,
    "salary" DECIMAL(10,2),
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "emergencyContact" JSONB NOT NULL DEFAULT '{}',
    "address" JSONB NOT NULL DEFAULT '{}',
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "additionalData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_department_idx" ON "Staff"("department");

-- CreateIndex
CREATE INDEX "Staff_employmentStatus_idx" ON "Staff"("employmentStatus");

-- CreateIndex
CREATE INDEX "Staff_createdById_idx" ON "Staff"("createdById");

-- CreateIndex
CREATE INDEX "Staff_updatedById_idx" ON "Staff"("updatedById");

-- CreateIndex
CREATE INDEX "Staff_deletedById_idx" ON "Staff"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE INDEX "StaffProfile_staffId_idx" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE INDEX "StaffProfile_createdById_idx" ON "StaffProfile"("createdById");

-- CreateIndex
CREATE INDEX "StaffProfile_updatedById_idx" ON "StaffProfile"("updatedById");

-- CreateIndex
CREATE INDEX "StaffProfile_deletedById_idx" ON "StaffProfile"("deletedById");

-- CreateIndex
CREATE INDEX "AuditLog_traceId_idx" ON "AuditLog"("traceId");

-- CreateIndex
CREATE INDEX "AuditLog_status_idx" ON "AuditLog"("status");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "UserSession_lastActivityAt_idx" ON "UserSession"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
