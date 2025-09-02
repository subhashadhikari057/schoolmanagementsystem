-- CreateEnum
CREATE TYPE "public"."ExamDateslotType" AS ENUM ('EXAM', 'BREAK', 'LUNCH', 'PREPARATION');

-- CreateTable
CREATE TABLE "public"."ExamSchedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "calendarEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamDateslot" (
    "id" TEXT NOT NULL,
    "calendarEntryId" TEXT NOT NULL,
    "examDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "label" TEXT,
    "type" "public"."ExamDateslotType" NOT NULL DEFAULT 'EXAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ExamDateslot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamSlot" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "dateslotId" TEXT NOT NULL,
    "subjectId" TEXT,
    "roomId" TEXT,
    "duration" INTEGER,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ExamSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamSchedule_classId_idx" ON "public"."ExamSchedule"("classId");

-- CreateIndex
CREATE INDEX "ExamSchedule_calendarEntryId_idx" ON "public"."ExamSchedule"("calendarEntryId");

-- CreateIndex
CREATE INDEX "ExamSchedule_academicYear_idx" ON "public"."ExamSchedule"("academicYear");

-- CreateIndex
CREATE INDEX "ExamSchedule_status_idx" ON "public"."ExamSchedule"("status");

-- CreateIndex
CREATE INDEX "ExamSchedule_createdById_idx" ON "public"."ExamSchedule"("createdById");

-- CreateIndex
CREATE INDEX "ExamSchedule_updatedById_idx" ON "public"."ExamSchedule"("updatedById");

-- CreateIndex
CREATE INDEX "ExamSchedule_deletedById_idx" ON "public"."ExamSchedule"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSchedule_classId_calendarEntryId_key" ON "public"."ExamSchedule"("classId", "calendarEntryId");

-- CreateIndex
CREATE INDEX "ExamDateslot_calendarEntryId_idx" ON "public"."ExamDateslot"("calendarEntryId");

-- CreateIndex
CREATE INDEX "ExamDateslot_examDate_idx" ON "public"."ExamDateslot"("examDate");

-- CreateIndex
CREATE INDEX "ExamDateslot_type_idx" ON "public"."ExamDateslot"("type");

-- CreateIndex
CREATE INDEX "ExamDateslot_createdById_idx" ON "public"."ExamDateslot"("createdById");

-- CreateIndex
CREATE INDEX "ExamDateslot_updatedById_idx" ON "public"."ExamDateslot"("updatedById");

-- CreateIndex
CREATE INDEX "ExamDateslot_deletedById_idx" ON "public"."ExamDateslot"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDateslot_calendarEntryId_examDate_startTime_endTime_key" ON "public"."ExamDateslot"("calendarEntryId", "examDate", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "ExamSlot_examScheduleId_idx" ON "public"."ExamSlot"("examScheduleId");

-- CreateIndex
CREATE INDEX "ExamSlot_dateslotId_idx" ON "public"."ExamSlot"("dateslotId");

-- CreateIndex
CREATE INDEX "ExamSlot_subjectId_idx" ON "public"."ExamSlot"("subjectId");

-- CreateIndex
CREATE INDEX "ExamSlot_roomId_idx" ON "public"."ExamSlot"("roomId");

-- CreateIndex
CREATE INDEX "ExamSlot_createdById_idx" ON "public"."ExamSlot"("createdById");

-- CreateIndex
CREATE INDEX "ExamSlot_updatedById_idx" ON "public"."ExamSlot"("updatedById");

-- CreateIndex
CREATE INDEX "ExamSlot_deletedById_idx" ON "public"."ExamSlot"("deletedById");

-- AddForeignKey
ALTER TABLE "public"."ExamSchedule" ADD CONSTRAINT "ExamSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamSchedule" ADD CONSTRAINT "ExamSchedule_calendarEntryId_fkey" FOREIGN KEY ("calendarEntryId") REFERENCES "public"."CalendarEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamDateslot" ADD CONSTRAINT "ExamDateslot_calendarEntryId_fkey" FOREIGN KEY ("calendarEntryId") REFERENCES "public"."CalendarEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamSlot" ADD CONSTRAINT "ExamSlot_dateslotId_fkey" FOREIGN KEY ("dateslotId") REFERENCES "public"."ExamDateslot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamSlot" ADD CONSTRAINT "ExamSlot_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "public"."ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamSlot" ADD CONSTRAINT "ExamSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamSlot" ADD CONSTRAINT "ExamSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
