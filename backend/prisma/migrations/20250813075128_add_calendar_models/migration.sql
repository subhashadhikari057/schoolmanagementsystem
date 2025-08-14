-- CreateEnum
CREATE TYPE "public"."CalendarEntryType" AS ENUM ('HOLIDAY', 'EVENT', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."HolidayType" AS ENUM ('NATIONAL', 'SCHOOL', 'RELIGIOUS', 'CULTURAL');

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('EXAM', 'FEE_DEADLINE', 'ASSIGNMENT', 'MEETING', 'ADMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."CalendarEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CalendarEntryType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "venue" TEXT,
    "timing" TEXT,
    "holidayType" "public"."HolidayType",
    "reminderType" "public"."ReminderType",
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "bsYear" INTEGER,
    "bsMonth" INTEGER,
    "bsDay" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" JSONB,
    "metadata" JSONB DEFAULT '{}',
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEntry_type_idx" ON "public"."CalendarEntry"("type");

-- CreateIndex
CREATE INDEX "CalendarEntry_startDate_idx" ON "public"."CalendarEntry"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEntry_endDate_idx" ON "public"."CalendarEntry"("endDate");

-- CreateIndex
CREATE INDEX "CalendarEntry_isPublished_idx" ON "public"."CalendarEntry"("isPublished");

-- CreateIndex
CREATE INDEX "CalendarEntry_status_idx" ON "public"."CalendarEntry"("status");

-- CreateIndex
CREATE INDEX "CalendarEntry_createdById_idx" ON "public"."CalendarEntry"("createdById");

-- CreateIndex
CREATE INDEX "CalendarEntry_updatedById_idx" ON "public"."CalendarEntry"("updatedById");

-- CreateIndex
CREATE INDEX "CalendarEntry_deletedById_idx" ON "public"."CalendarEntry"("deletedById");

-- CreateIndex
CREATE INDEX "CalendarEntry_bsYear_bsMonth_idx" ON "public"."CalendarEntry"("bsYear", "bsMonth");
