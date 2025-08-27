-- Step 1: Add leaveTypeId as nullable column first
ALTER TABLE "TeacherLeaveRequest" ADD COLUMN "leaveTypeId" TEXT;

-- Step 2: Create default leave types based on the enum values that might exist
INSERT INTO "LeaveType" (id, name, description, "maxDays", "isPaid", status, "createdAt")
VALUES 
  (gen_random_uuid(), 'Sick Leave', 'Medical leave for illness', 12, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Personal Leave', 'Personal time off', 5, false, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Vacation Leave', 'Annual vacation time', 21, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Emergency Leave', 'Emergency situations', 3, false, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Medical Leave', 'Extended medical leave', 30, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Family Leave', 'Family related leave', 7, false, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Professional Development', 'Training and development', 5, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Conference Leave', 'Conference attendance', 3, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Workshop Leave', 'Workshop attendance', 2, true, 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Other Leave', 'Other types of leave', 5, false, 'ACTIVE', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 3: Update existing TeacherLeaveRequest records to reference the new leave types
UPDATE "TeacherLeaveRequest" 
SET "leaveTypeId" = (
  CASE 
    WHEN type = 'SICK' THEN (SELECT id FROM "LeaveType" WHERE name = 'Sick Leave' LIMIT 1)
    WHEN type = 'PERSONAL' THEN (SELECT id FROM "LeaveType" WHERE name = 'Personal Leave' LIMIT 1)
    WHEN type = 'VACATION' THEN (SELECT id FROM "LeaveType" WHERE name = 'Vacation Leave' LIMIT 1)
    WHEN type = 'EMERGENCY' THEN (SELECT id FROM "LeaveType" WHERE name = 'Emergency Leave' LIMIT 1)
    WHEN type = 'MEDICAL' THEN (SELECT id FROM "LeaveType" WHERE name = 'Medical Leave' LIMIT 1)
    WHEN type = 'FAMILY' THEN (SELECT id FROM "LeaveType" WHERE name = 'Family Leave' LIMIT 1)
    WHEN type = 'PROFESSIONAL_DEVELOPMENT' THEN (SELECT id FROM "LeaveType" WHERE name = 'Professional Development' LIMIT 1)
    WHEN type = 'CONFERENCE' THEN (SELECT id FROM "LeaveType" WHERE name = 'Conference Leave' LIMIT 1)
    WHEN type = 'WORKSHOP' THEN (SELECT id FROM "LeaveType" WHERE name = 'Workshop Leave' LIMIT 1)
    ELSE (SELECT id FROM "LeaveType" WHERE name = 'Other Leave' LIMIT 1)
  END
);

-- Step 4: Make leaveTypeId NOT NULL
ALTER TABLE "TeacherLeaveRequest" ALTER COLUMN "leaveTypeId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_leaveTypeId_fkey" 
FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"(id);

-- Step 6: Add index for performance
CREATE INDEX "TeacherLeaveRequest_leaveTypeId_idx" ON "TeacherLeaveRequest"("leaveTypeId");

-- Step 7: Drop the old type column and enum (after confirming everything works)
-- ALTER TABLE "TeacherLeaveRequest" DROP COLUMN "type";
-- DROP TYPE "TeacherLeaveRequestType";

