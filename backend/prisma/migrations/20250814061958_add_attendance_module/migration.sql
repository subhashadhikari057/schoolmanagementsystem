-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "remarks" TEXT,
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "public"."AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_classId_idx" ON "public"."AttendanceRecord"("classId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_attendanceDate_idx" ON "public"."AttendanceRecord"("attendanceDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "public"."AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_createdById_idx" ON "public"."AttendanceRecord"("createdById");

-- CreateIndex
CREATE INDEX "AttendanceRecord_updatedById_idx" ON "public"."AttendanceRecord"("updatedById");

-- CreateIndex
CREATE INDEX "AttendanceRecord_deletedById_idx" ON "public"."AttendanceRecord"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_attendanceDate_key" ON "public"."AttendanceRecord"("studentId", "attendanceDate");

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
