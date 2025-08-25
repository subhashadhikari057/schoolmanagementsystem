-- CreateTable
CREATE TABLE "public"."WorkingDaysTracker" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "saturdays" INTEGER NOT NULL,
    "holidays" INTEGER NOT NULL,
    "events" INTEGER NOT NULL,
    "exams" INTEGER NOT NULL,
    "availableDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingDaysTracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkingDaysTracker_month_idx" ON "public"."WorkingDaysTracker"("month");

-- CreateIndex
CREATE INDEX "WorkingDaysTracker_year_idx" ON "public"."WorkingDaysTracker"("year");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingDaysTracker_month_year_key" ON "public"."WorkingDaysTracker"("month", "year");
