-- CreateEnum
CREATE TYPE "public"."PromotionType" AS ENUM ('PROMOTED', 'RETAINED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "public"."PromotionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."academic_years" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotion_batches" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "fromAcademicYear" TEXT NOT NULL,
    "toAcademicYear" TEXT NOT NULL,
    "status" "public"."PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "promotedStudents" INTEGER NOT NULL DEFAULT 0,
    "retainedStudents" INTEGER NOT NULL DEFAULT 0,
    "graduatedStudents" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "executedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "promotion_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotion_records" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClassId" TEXT NOT NULL,
    "toClassId" TEXT,
    "promotionType" "public"."PromotionType" NOT NULL,
    "status" "public"."PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "ineligibilityReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attendancePercentage" DECIMAL(5,2),
    "gpa" DECIMAL(4,2),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "promotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "public"."academic_years"("year");

-- CreateIndex
CREATE INDEX "promotion_records_studentId_idx" ON "public"."promotion_records"("studentId");

-- CreateIndex
CREATE INDEX "promotion_records_fromClassId_idx" ON "public"."promotion_records"("fromClassId");

-- CreateIndex
CREATE INDEX "promotion_records_toClassId_idx" ON "public"."promotion_records"("toClassId");

-- CreateIndex
CREATE INDEX "promotion_records_promotionType_idx" ON "public"."promotion_records"("promotionType");

-- CreateIndex
CREATE INDEX "promotion_records_status_idx" ON "public"."promotion_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_records_batchId_studentId_key" ON "public"."promotion_records"("batchId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."promotion_batches" ADD CONSTRAINT "promotion_batches_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_batches" ADD CONSTRAINT "promotion_batches_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_records" ADD CONSTRAINT "promotion_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."promotion_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_records" ADD CONSTRAINT "promotion_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_records" ADD CONSTRAINT "promotion_records_fromClassId_fkey" FOREIGN KEY ("fromClassId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_records" ADD CONSTRAINT "promotion_records_toClassId_fkey" FOREIGN KEY ("toClassId") REFERENCES "public"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
