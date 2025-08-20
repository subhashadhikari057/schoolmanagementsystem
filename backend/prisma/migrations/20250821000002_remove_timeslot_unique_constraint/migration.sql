-- Drop the unique constraint on ClassTimeslot
ALTER TABLE "ClassTimeslot" DROP CONSTRAINT IF EXISTS "ClassTimeslot_classId_day_startTime_endTime_key";
