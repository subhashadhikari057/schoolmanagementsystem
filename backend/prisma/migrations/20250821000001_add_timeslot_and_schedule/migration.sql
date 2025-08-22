-- CreateEnum
CREATE TYPE "TimeslotType" AS ENUM ('REGULAR', 'BREAK', 'LUNCH', 'ACTIVITY', 'STUDY_HALL', 'FREE_PERIOD');

-- CreateTable
CREATE TABLE "ClassTimeslot" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "type" "TimeslotType" NOT NULL DEFAULT 'REGULAR',
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdById" UUID,
  "updatedById" UUID,
  "deletedById" UUID,

  CONSTRAINT "ClassTimeslot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdById" UUID,
  "updatedById" UUID,
  "deletedById" UUID,

  CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "timeslotId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "subjectId" TEXT,
  "teacherId" TEXT,
  "roomId" TEXT,
  "type" "TimeslotType" NOT NULL DEFAULT 'REGULAR',
  "hasConflict" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdById" UUID,
  "updatedById" UUID,
  "deletedById" UUID,

  CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassTimeslot_classId_idx" ON "ClassTimeslot"("classId");
CREATE INDEX "ClassTimeslot_day_idx" ON "ClassTimeslot"("day");
CREATE INDEX "ClassTimeslot_type_idx" ON "ClassTimeslot"("type");
CREATE INDEX "ClassTimeslot_createdById_idx" ON "ClassTimeslot"("createdById");
CREATE INDEX "ClassTimeslot_updatedById_idx" ON "ClassTimeslot"("updatedById");
CREATE INDEX "ClassTimeslot_deletedById_idx" ON "ClassTimeslot"("deletedById");

-- CreateIndex
CREATE INDEX "ClassSchedule_classId_idx" ON "ClassSchedule"("classId");
CREATE INDEX "ClassSchedule_academicYear_idx" ON "ClassSchedule"("academicYear");
CREATE INDEX "ClassSchedule_status_idx" ON "ClassSchedule"("status");
CREATE INDEX "ClassSchedule_createdById_idx" ON "ClassSchedule"("createdById");
CREATE INDEX "ClassSchedule_updatedById_idx" ON "ClassSchedule"("updatedById");
CREATE INDEX "ClassSchedule_deletedById_idx" ON "ClassSchedule"("deletedById");

-- CreateIndex
CREATE INDEX "ScheduleSlot_scheduleId_idx" ON "ScheduleSlot"("scheduleId");
CREATE INDEX "ScheduleSlot_timeslotId_idx" ON "ScheduleSlot"("timeslotId");
CREATE INDEX "ScheduleSlot_day_idx" ON "ScheduleSlot"("day");
CREATE INDEX "ScheduleSlot_subjectId_idx" ON "ScheduleSlot"("subjectId");
CREATE INDEX "ScheduleSlot_teacherId_idx" ON "ScheduleSlot"("teacherId");
CREATE INDEX "ScheduleSlot_roomId_idx" ON "ScheduleSlot"("roomId");
CREATE INDEX "ScheduleSlot_createdById_idx" ON "ScheduleSlot"("createdById");
CREATE INDEX "ScheduleSlot_updatedById_idx" ON "ScheduleSlot"("updatedById");
CREATE INDEX "ScheduleSlot_deletedById_idx" ON "ScheduleSlot"("deletedById");

-- AddForeignKey
ALTER TABLE "ClassTimeslot" ADD CONSTRAINT "ClassTimeslot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "ClassTimeslot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraint to ensure only one active schedule per class
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_classId_status_key" UNIQUE ("classId", "status");
