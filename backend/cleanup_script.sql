-- Final cleanup: Remove the old type column and enum
ALTER TABLE "TeacherLeaveRequest" DROP COLUMN IF EXISTS "type";
DROP TYPE IF EXISTS "TeacherLeaveRequestType";

