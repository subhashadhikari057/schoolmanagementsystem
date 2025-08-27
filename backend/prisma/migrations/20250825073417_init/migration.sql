-- CreateEnum
CREATE TYPE "public"."CalendarEntryType" AS ENUM ('HOLIDAY', 'EVENT', 'EXAM', 'EMERGENCY_CLOSURE');

-- CreateEnum
CREATE TYPE "public"."HolidayType" AS ENUM ('NATIONAL', 'SCHOOL');

-- CreateEnum
CREATE TYPE "public"."ExamType" AS ENUM ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM', 'FINAL', 'UNIT_TEST', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EmergencyClosureType" AS ENUM ('NATURAL_DISASTER', 'STRIKE', 'PANDEMIC', 'POWER_OUTAGE', 'SECURITY_CONCERN', 'INFRASTRUCTURE_DAMAGE', 'WEATHER_EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EventScope" AS ENUM ('PARTIAL', 'SCHOOL_WIDE');

-- CreateEnum
CREATE TYPE "public"."ClassShift" AS ENUM ('MORNING', 'DAY');

-- CreateEnum
CREATE TYPE "public"."SalaryChangeType" AS ENUM ('INITIAL', 'PROMOTION', 'DEMOTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."TimeslotType" AS ENUM ('REGULAR', 'BREAK', 'LUNCH', 'ACTIVITY', 'STUDY_HALL', 'FREE_PERIOD');

-- CreateEnum
CREATE TYPE "public"."NoticePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."NoticeRecipientType" AS ENUM ('ALL', 'STUDENT', 'PARENT', 'TEACHER', 'STAFF', 'CLASS');

-- CreateEnum
CREATE TYPE "public"."NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAMINATION', 'FEE', 'EVENT', 'HOLIDAY', 'MEETING', 'ANNOUNCEMENT', 'URGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."FeeItemFrequency" AS ENUM ('MONTHLY', 'TERM', 'ANNUAL', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."FeeStructureStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ScholarshipType" AS ENUM ('MERIT', 'NEED_BASED', 'SPORTS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ValueType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "public"."ChargeType" AS ENUM ('FINE', 'EQUIPMENT', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "public"."ComplaintType" AS ENUM ('ACADEMIC', 'BEHAVIORAL', 'FACILITY', 'SAFETY', 'BULLYING', 'DISCIPLINARY', 'FINANCIAL', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ComplaintRecipientType" AS ENUM ('CLASS_TEACHER', 'ADMINISTRATION', 'PARENT');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastPasswordChange" TIMESTAMP(3),
    "needPasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "maxMarks" INTEGER NOT NULL,
    "passMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Class" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "grade" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "shift" "public"."ClassShift" NOT NULL DEFAULT 'MORNING',
    "status" TEXT NOT NULL DEFAULT 'active',
    "roomId" TEXT NOT NULL,
    "classTeacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Classroom" (
    "id" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "name" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "building" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "ethnicity" TEXT,
    "imageUrl" TEXT,
    "fatherPhone" TEXT,
    "motherPhone" TEXT,
    "fatherEmail" TEXT,
    "motherEmail" TEXT,
    "fatherOccupation" TEXT,
    "motherOccupation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "academicStatus" TEXT NOT NULL DEFAULT 'active',
    "address" TEXT,
    "allergies" TEXT,
    "city" TEXT,
    "createdById" UUID,
    "dateOfBirth" TIMESTAMP(3),
    "deletedById" UUID,
    "feeStatus" TEXT NOT NULL DEFAULT 'pending',
    "interests" TEXT,
    "maritalStatus" TEXT DEFAULT 'Single',
    "medicalConditions" TEXT,
    "phone" TEXT,
    "pinCode" TEXT,
    "profilePhotoUrl" TEXT,
    "specialNeeds" TEXT,
    "state" TEXT,
    "street" TEXT,
    "studentId" TEXT,
    "transportMode" TEXT,
    "updatedById" UUID,
    "fatherFirstName" TEXT,
    "fatherMiddleName" TEXT,
    "fatherLastName" TEXT,
    "motherFirstName" TEXT,
    "motherMiddleName" TEXT,
    "motherLastName" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "emergencyContact" JSONB NOT NULL DEFAULT '{}',
    "interests" JSONB NOT NULL DEFAULT '{}',
    "additionalData" JSONB NOT NULL DEFAULT '{}',
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Guardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "occupation" TEXT,
    "workPlace" TEXT,
    "workPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "socialLinks" JSONB DEFAULT '{}',
    "additionalData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentStudentLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "experienceYears" INTEGER,
    "qualification" TEXT,
    "designation" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "maritalStatus" TEXT,
    "imageUrl" TEXT,
    "department" TEXT,
    "specialization" TEXT,
    "employmentStatus" TEXT DEFAULT 'active',
    "employmentDate" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
    "languagesKnown" JSONB DEFAULT '[]',
    "certifications" TEXT,
    "previousExperience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,
    "bankAccountNumber" TEXT,
    "bankBranch" TEXT,
    "bankName" TEXT,
    "citizenshipNumber" TEXT,
    "panNumber" TEXT,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherProfile" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "contactInfo" JSONB DEFAULT '{}',
    "socialLinks" JSONB DEFAULT '{}',
    "additionalData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherSubject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherClass" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "employeeId" TEXT,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "phone" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL,
    "maritalStatus" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "employmentDate" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3),
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,
    "bankAccountNumber" TEXT,
    "bankBranch" TEXT,
    "bankName" TEXT,
    "citizenshipNumber" TEXT,
    "panNumber" TEXT,
    "employmentStatus" TEXT DEFAULT 'active',
    "experienceYears" INTEGER,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffProfile" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "contactInfo" JSONB DEFAULT '{}',
    "additionalData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IDCard" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "batchName" TEXT,
    "issuedForId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IDCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IDCardTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IDCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "isCurrentDevice" BOOLEAN NOT NULL DEFAULT false,
    "previousTokenHash" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEntry" (
    "id" TEXT NOT NULL,
    "type" "public"."CalendarEntryType" NOT NULL,
    "eventScope" "public"."EventScope",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "holidayType" "public"."HolidayType",
    "startTime" TEXT,
    "endTime" TEXT,
    "examType" "public"."ExamType",
    "examDetails" TEXT,
    "emergencyClosureType" "public"."EmergencyClosureType",
    "emergencyReason" TEXT,
    "affectedAreas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,
    "name" TEXT NOT NULL,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "fileLinks" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassTimeslot" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "type" "public"."TimeslotType" NOT NULL DEFAULT 'REGULAR',
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
CREATE TABLE "public"."ClassSchedule" (
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
CREATE TABLE "public"."ScheduleSlot" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "timeslotId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "roomId" TEXT,
    "type" "public"."TimeslotType" NOT NULL DEFAULT 'REGULAR',
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherSalaryHistory" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "effectiveMonth" DATE NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "changeType" "public"."SalaryChangeType" NOT NULL DEFAULT 'INITIAL',
    "changeReason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherSalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffSalaryHistory" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "effectiveMonth" DATE NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "changeType" "public"."SalaryChangeType" NOT NULL DEFAULT 'INITIAL',
    "changeReason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "StaffSalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "public"."NoticePriority" NOT NULL,
    "recipientType" "public"."NoticeRecipientType" NOT NULL,
    "selectedClassId" TEXT,
    "category" "public"."NoticeCategory",
    "publishDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NoticeRecipient" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NoticeAttachment" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructure" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."FeeStructureStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructureAssignment" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeeStructureAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructureItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "public"."FeeItemFrequency" NOT NULL DEFAULT 'MONTHLY',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "FeeStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructureHistory" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "totalAnnual" DECIMAL(12,2) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeeStructureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScholarshipDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ScholarshipType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "valueType" "public"."ValueType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL,
    "appliesToCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ScholarshipDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScholarshipAssignment" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "expiresAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScholarshipAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChargeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ChargeType" NOT NULL DEFAULT 'FINE',
    "category" TEXT,
    "description" TEXT,
    "valueType" "public"."ValueType" NOT NULL DEFAULT 'FIXED',
    "value" DECIMAL(10,2) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ChargeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChargeAssignment" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "appliedMonth" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChargeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentFeeHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "periodMonth" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "scholarshipAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "extraChargesAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalPayable" DECIMAL(12,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "StudentFeeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'daily',
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

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
    "emergencyClosures" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingDaysTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."ComplaintType" NOT NULL,
    "priority" "public"."ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "recipientType" "public"."ComplaintRecipientType" NOT NULL,
    "recipientId" TEXT,
    "complainantId" TEXT NOT NULL,
    "complainantType" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintResponse" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintAttachment" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintAuditLog" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "User_createdById_idx" ON "public"."User"("createdById");

-- CreateIndex
CREATE INDEX "User_updatedById_idx" ON "public"."User"("updatedById");

-- CreateIndex
CREATE INDEX "User_deletedById_idx" ON "public"."User"("deletedById");

-- CreateIndex
CREATE INDEX "User_fullName_idx" ON "public"."User"("fullName");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Subject_createdById_idx" ON "public"."Subject"("createdById");

-- CreateIndex
CREATE INDEX "Subject_updatedById_idx" ON "public"."Subject"("updatedById");

-- CreateIndex
CREATE INDEX "Subject_deletedById_idx" ON "public"."Subject"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_deletedAt_key" ON "public"."Subject"("code", "deletedAt");

-- CreateIndex
CREATE INDEX "Class_createdById_idx" ON "public"."Class"("createdById");

-- CreateIndex
CREATE INDEX "Class_updatedById_idx" ON "public"."Class"("updatedById");

-- CreateIndex
CREATE INDEX "Class_deletedById_idx" ON "public"."Class"("deletedById");

-- CreateIndex
CREATE INDEX "Class_grade_idx" ON "public"."Class"("grade");

-- CreateIndex
CREATE INDEX "Class_section_idx" ON "public"."Class"("section");

-- CreateIndex
CREATE INDEX "Class_shift_idx" ON "public"."Class"("shift");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_roomNo_key" ON "public"."Classroom"("roomNo");

-- CreateIndex
CREATE INDEX "Classroom_createdById_idx" ON "public"."Classroom"("createdById");

-- CreateIndex
CREATE INDEX "Classroom_updatedById_idx" ON "public"."Classroom"("updatedById");

-- CreateIndex
CREATE INDEX "Classroom_deletedById_idx" ON "public"."Classroom"("deletedById");

-- CreateIndex
CREATE INDEX "Classroom_status_idx" ON "public"."Classroom"("status");

-- CreateIndex
CREATE INDEX "Classroom_isAvailable_idx" ON "public"."Classroom"("isAvailable");

-- CreateIndex
CREATE INDEX "ClassSubject_createdById_idx" ON "public"."ClassSubject"("createdById");

-- CreateIndex
CREATE INDEX "ClassSubject_updatedById_idx" ON "public"."ClassSubject"("updatedById");

-- CreateIndex
CREATE INDEX "ClassSubject_deletedById_idx" ON "public"."ClassSubject"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "public"."ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "public"."Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "public"."Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_userId_idx" ON "public"."Student"("userId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "public"."Student"("classId");

-- CreateIndex
CREATE INDEX "Student_rollNumber_idx" ON "public"."Student"("rollNumber");

-- CreateIndex
CREATE INDEX "Student_createdById_idx" ON "public"."Student"("createdById");

-- CreateIndex
CREATE INDEX "Student_updatedById_idx" ON "public"."Student"("updatedById");

-- CreateIndex
CREATE INDEX "Student_deletedById_idx" ON "public"."Student"("deletedById");

-- CreateIndex
CREATE INDEX "Student_academicStatus_idx" ON "public"."Student"("academicStatus");

-- CreateIndex
CREATE INDEX "Student_ethnicity_idx" ON "public"."Student"("ethnicity");

-- CreateIndex
CREATE INDEX "Student_feeStatus_idx" ON "public"."Student"("feeStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_rollNumber_key" ON "public"."Student"("classId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "public"."StudentProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "public"."Parent"("userId");

-- CreateIndex
CREATE INDEX "Parent_createdById_idx" ON "public"."Parent"("createdById");

-- CreateIndex
CREATE INDEX "Parent_updatedById_idx" ON "public"."Parent"("updatedById");

-- CreateIndex
CREATE INDEX "Parent_deletedById_idx" ON "public"."Parent"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_parentId_key" ON "public"."ParentProfile"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_parentId_idx" ON "public"."ParentStudentLink"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_studentId_idx" ON "public"."ParentStudentLink"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_parentId_studentId_key" ON "public"."ParentStudentLink"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "public"."Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "public"."Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "Teacher_createdById_idx" ON "public"."Teacher"("createdById");

-- CreateIndex
CREATE INDEX "Teacher_updatedById_idx" ON "public"."Teacher"("updatedById");

-- CreateIndex
CREATE INDEX "Teacher_deletedById_idx" ON "public"."Teacher"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_teacherId_key" ON "public"."TeacherProfile"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSubject_createdById_idx" ON "public"."TeacherSubject"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSubject_updatedById_idx" ON "public"."TeacherSubject"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSubject_deletedById_idx" ON "public"."TeacherSubject"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherClass_createdById_idx" ON "public"."TeacherClass"("createdById");

-- CreateIndex
CREATE INDEX "TeacherClass_updatedById_idx" ON "public"."TeacherClass"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherClass_deletedById_idx" ON "public"."TeacherClass"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "public"."Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeId_key" ON "public"."Staff"("employeeId");

-- CreateIndex
CREATE INDEX "Staff_createdById_idx" ON "public"."Staff"("createdById");

-- CreateIndex
CREATE INDEX "Staff_updatedById_idx" ON "public"."Staff"("updatedById");

-- CreateIndex
CREATE INDEX "Staff_deletedById_idx" ON "public"."Staff"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "public"."StaffProfile"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "public"."UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE INDEX "CalendarEntry_type_idx" ON "public"."CalendarEntry"("type");

-- CreateIndex
CREATE INDEX "CalendarEntry_eventScope_idx" ON "public"."CalendarEntry"("eventScope");

-- CreateIndex
CREATE INDEX "CalendarEntry_startDate_idx" ON "public"."CalendarEntry"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEntry_endDate_idx" ON "public"."CalendarEntry"("endDate");

-- CreateIndex
CREATE INDEX "CalendarEntry_createdById_idx" ON "public"."CalendarEntry"("createdById");

-- CreateIndex
CREATE INDEX "CalendarEntry_updatedById_idx" ON "public"."CalendarEntry"("updatedById");

-- CreateIndex
CREATE INDEX "CalendarEntry_deletedById_idx" ON "public"."CalendarEntry"("deletedById");

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "public"."Assignment"("classId");

-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "public"."Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_idx" ON "public"."Assignment"("teacherId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "public"."Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Assignment_createdById_idx" ON "public"."Assignment"("createdById");

-- CreateIndex
CREATE INDEX "Assignment_updatedById_idx" ON "public"."Assignment"("updatedById");

-- CreateIndex
CREATE INDEX "Assignment_deletedById_idx" ON "public"."Assignment"("deletedById");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "public"."Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "public"."Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_isCompleted_idx" ON "public"."Submission"("isCompleted");

-- CreateIndex
CREATE INDEX "Submission_createdById_idx" ON "public"."Submission"("createdById");

-- CreateIndex
CREATE INDEX "Submission_updatedById_idx" ON "public"."Submission"("updatedById");

-- CreateIndex
CREATE INDEX "Submission_deletedById_idx" ON "public"."Submission"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "public"."Submission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "ClassTimeslot_classId_idx" ON "public"."ClassTimeslot"("classId");

-- CreateIndex
CREATE INDEX "ClassTimeslot_day_idx" ON "public"."ClassTimeslot"("day");

-- CreateIndex
CREATE INDEX "ClassTimeslot_type_idx" ON "public"."ClassTimeslot"("type");

-- CreateIndex
CREATE INDEX "ClassTimeslot_createdById_idx" ON "public"."ClassTimeslot"("createdById");

-- CreateIndex
CREATE INDEX "ClassTimeslot_updatedById_idx" ON "public"."ClassTimeslot"("updatedById");

-- CreateIndex
CREATE INDEX "ClassTimeslot_deletedById_idx" ON "public"."ClassTimeslot"("deletedById");

-- CreateIndex
CREATE INDEX "ClassSchedule_classId_idx" ON "public"."ClassSchedule"("classId");

-- CreateIndex
CREATE INDEX "ClassSchedule_academicYear_idx" ON "public"."ClassSchedule"("academicYear");

-- CreateIndex
CREATE INDEX "ClassSchedule_status_idx" ON "public"."ClassSchedule"("status");

-- CreateIndex
CREATE INDEX "ClassSchedule_createdById_idx" ON "public"."ClassSchedule"("createdById");

-- CreateIndex
CREATE INDEX "ClassSchedule_updatedById_idx" ON "public"."ClassSchedule"("updatedById");

-- CreateIndex
CREATE INDEX "ClassSchedule_deletedById_idx" ON "public"."ClassSchedule"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_classId_status_key" ON "public"."ClassSchedule"("classId", "status");

-- CreateIndex
CREATE INDEX "ScheduleSlot_scheduleId_idx" ON "public"."ScheduleSlot"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_timeslotId_idx" ON "public"."ScheduleSlot"("timeslotId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_day_idx" ON "public"."ScheduleSlot"("day");

-- CreateIndex
CREATE INDEX "ScheduleSlot_subjectId_idx" ON "public"."ScheduleSlot"("subjectId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_teacherId_idx" ON "public"."ScheduleSlot"("teacherId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_roomId_idx" ON "public"."ScheduleSlot"("roomId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_createdById_idx" ON "public"."ScheduleSlot"("createdById");

-- CreateIndex
CREATE INDEX "ScheduleSlot_updatedById_idx" ON "public"."ScheduleSlot"("updatedById");

-- CreateIndex
CREATE INDEX "ScheduleSlot_deletedById_idx" ON "public"."ScheduleSlot"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_teacherId_idx" ON "public"."TeacherSalaryHistory"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_effectiveMonth_idx" ON "public"."TeacherSalaryHistory"("effectiveMonth");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_createdById_idx" ON "public"."TeacherSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_updatedById_idx" ON "public"."TeacherSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_deletedById_idx" ON "public"."TeacherSalaryHistory"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_approvedById_idx" ON "public"."TeacherSalaryHistory"("approvedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_staffId_idx" ON "public"."StaffSalaryHistory"("staffId");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_effectiveMonth_idx" ON "public"."StaffSalaryHistory"("effectiveMonth");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_createdById_idx" ON "public"."StaffSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_updatedById_idx" ON "public"."StaffSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_deletedById_idx" ON "public"."StaffSalaryHistory"("deletedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_approvedById_idx" ON "public"."StaffSalaryHistory"("approvedById");

-- CreateIndex
CREATE INDEX "Notice_recipientType_idx" ON "public"."Notice"("recipientType");

-- CreateIndex
CREATE INDEX "Notice_priority_idx" ON "public"."Notice"("priority");

-- CreateIndex
CREATE INDEX "Notice_category_idx" ON "public"."Notice"("category");

-- CreateIndex
CREATE INDEX "Notice_status_idx" ON "public"."Notice"("status");

-- CreateIndex
CREATE INDEX "Notice_publishDate_idx" ON "public"."Notice"("publishDate");

-- CreateIndex
CREATE INDEX "Notice_expiryDate_idx" ON "public"."Notice"("expiryDate");

-- CreateIndex
CREATE INDEX "Notice_selectedClassId_idx" ON "public"."Notice"("selectedClassId");

-- CreateIndex
CREATE INDEX "Notice_createdById_idx" ON "public"."Notice"("createdById");

-- CreateIndex
CREATE INDEX "Notice_updatedById_idx" ON "public"."Notice"("updatedById");

-- CreateIndex
CREATE INDEX "Notice_deletedById_idx" ON "public"."Notice"("deletedById");

-- CreateIndex
CREATE INDEX "NoticeRecipient_noticeId_idx" ON "public"."NoticeRecipient"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeRecipient_userId_idx" ON "public"."NoticeRecipient"("userId");

-- CreateIndex
CREATE INDEX "NoticeRecipient_readAt_idx" ON "public"."NoticeRecipient"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeRecipient_noticeId_userId_key" ON "public"."NoticeRecipient"("noticeId", "userId");

-- CreateIndex
CREATE INDEX "NoticeAttachment_noticeId_idx" ON "public"."NoticeAttachment"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeAttachment_mimeType_idx" ON "public"."NoticeAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "public"."FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYear_idx" ON "public"."FeeStructure"("academicYear");

-- CreateIndex
CREATE INDEX "FeeStructure_status_idx" ON "public"."FeeStructure"("status");

-- CreateIndex
CREATE INDEX "FeeStructure_effectiveFrom_idx" ON "public"."FeeStructure"("effectiveFrom");

-- CreateIndex
CREATE INDEX "FeeStructure_createdById_idx" ON "public"."FeeStructure"("createdById");

-- CreateIndex
CREATE INDEX "FeeStructure_updatedById_idx" ON "public"."FeeStructure"("updatedById");

-- CreateIndex
CREATE INDEX "FeeStructure_deletedById_idx" ON "public"."FeeStructure"("deletedById");

-- CreateIndex
CREATE INDEX "FeeStructureAssignment_classId_idx" ON "public"."FeeStructureAssignment"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureAssignment_feeStructureId_classId_key" ON "public"."FeeStructureAssignment"("feeStructureId", "classId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_feeStructureId_idx" ON "public"."FeeStructureItem"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_category_idx" ON "public"."FeeStructureItem"("category");

-- CreateIndex
CREATE INDEX "FeeStructureItem_frequency_idx" ON "public"."FeeStructureItem"("frequency");

-- CreateIndex
CREATE INDEX "FeeStructureHistory_feeStructureId_idx" ON "public"."FeeStructureHistory"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureHistory_effectiveFrom_idx" ON "public"."FeeStructureHistory"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureHistory_feeStructureId_version_key" ON "public"."FeeStructureHistory"("feeStructureId", "version");

-- CreateIndex
CREATE INDEX "ScholarshipDefinition_type_idx" ON "public"."ScholarshipDefinition"("type");

-- CreateIndex
CREATE INDEX "ScholarshipDefinition_isActive_idx" ON "public"."ScholarshipDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_scholarshipId_idx" ON "public"."ScholarshipAssignment"("scholarshipId");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_studentId_idx" ON "public"."ScholarshipAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_effectiveFrom_idx" ON "public"."ScholarshipAssignment"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ChargeDefinition_type_idx" ON "public"."ChargeDefinition"("type");

-- CreateIndex
CREATE INDEX "ChargeDefinition_isActive_idx" ON "public"."ChargeDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ChargeAssignment_chargeId_idx" ON "public"."ChargeAssignment"("chargeId");

-- CreateIndex
CREATE INDEX "ChargeAssignment_studentId_idx" ON "public"."ChargeAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ChargeAssignment_appliedMonth_idx" ON "public"."ChargeAssignment"("appliedMonth");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_studentId_idx" ON "public"."StudentFeeHistory"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_feeStructureId_idx" ON "public"."StudentFeeHistory"("feeStructureId");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_periodMonth_idx" ON "public"."StudentFeeHistory"("periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeHistory_studentId_periodMonth_version_key" ON "public"."StudentFeeHistory"("studentId", "periodMonth", "version");

-- CreateIndex
CREATE INDEX "AttendanceSession_classId_idx" ON "public"."AttendanceSession"("classId");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "public"."AttendanceSession"("date");

-- CreateIndex
CREATE INDEX "AttendanceSession_markedBy_idx" ON "public"."AttendanceSession"("markedBy");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_classId_date_sessionType_key" ON "public"."AttendanceSession"("classId", "date", "sessionType");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "public"."AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "public"."AttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "public"."AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "public"."AttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "WorkingDaysTracker_month_idx" ON "public"."WorkingDaysTracker"("month");

-- CreateIndex
CREATE INDEX "WorkingDaysTracker_year_idx" ON "public"."WorkingDaysTracker"("year");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingDaysTracker_month_year_key" ON "public"."WorkingDaysTracker"("month", "year");

-- CreateIndex
CREATE INDEX "Complaint_complainantId_idx" ON "public"."Complaint"("complainantId");

-- CreateIndex
CREATE INDEX "Complaint_recipientId_idx" ON "public"."Complaint"("recipientId");

-- CreateIndex
CREATE INDEX "Complaint_assignedToId_idx" ON "public"."Complaint"("assignedToId");

-- CreateIndex
CREATE INDEX "Complaint_type_idx" ON "public"."Complaint"("type");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "public"."Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_recipientType_idx" ON "public"."Complaint"("recipientType");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "public"."Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_createdById_idx" ON "public"."Complaint"("createdById");

-- CreateIndex
CREATE INDEX "Complaint_updatedById_idx" ON "public"."Complaint"("updatedById");

-- CreateIndex
CREATE INDEX "Complaint_deletedById_idx" ON "public"."Complaint"("deletedById");

-- CreateIndex
CREATE INDEX "ComplaintResponse_complaintId_idx" ON "public"."ComplaintResponse"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintResponse_responderId_idx" ON "public"."ComplaintResponse"("responderId");

-- CreateIndex
CREATE INDEX "ComplaintResponse_createdAt_idx" ON "public"."ComplaintResponse"("createdAt");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_complaintId_idx" ON "public"."ComplaintAttachment"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_mimeType_idx" ON "public"."ComplaintAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_complaintId_idx" ON "public"."ComplaintAuditLog"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_action_idx" ON "public"."ComplaintAuditLog"("action");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_performedBy_idx" ON "public"."ComplaintAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_performedAt_idx" ON "public"."ComplaintAuditLog"("performedAt");

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "public"."Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSubject" ADD CONSTRAINT "ClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentProfile" ADD CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Guardian" ADD CONSTRAINT "Guardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentProfile" ADD CONSTRAINT "ParentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherClass" ADD CONSTRAINT "TeacherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffProfile" ADD CONSTRAINT "StaffProfile_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IDCard" ADD CONSTRAINT "IDCard_issuedForId_fkey" FOREIGN KEY ("issuedForId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IDCard" ADD CONSTRAINT "IDCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."IDCardTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassTimeslot" ADD CONSTRAINT "ClassTimeslot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."ClassSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_timeslotId_fkey" FOREIGN KEY ("timeslotId") REFERENCES "public"."ClassTimeslot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherSalaryHistory" ADD CONSTRAINT "TeacherSalaryHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherSalaryHistory" ADD CONSTRAINT "TeacherSalaryHistory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSalaryHistory" ADD CONSTRAINT "StaffSalaryHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSalaryHistory" ADD CONSTRAINT "StaffSalaryHistory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_selectedClassId_fkey" FOREIGN KEY ("selectedClassId") REFERENCES "public"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeRecipient" ADD CONSTRAINT "NoticeRecipient_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "public"."Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeRecipient" ADD CONSTRAINT "NoticeRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeAttachment" ADD CONSTRAINT "NoticeAttachment_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "public"."Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureAssignment" ADD CONSTRAINT "FeeStructureAssignment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureAssignment" ADD CONSTRAINT "FeeStructureAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureHistory" ADD CONSTRAINT "FeeStructureHistory_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScholarshipAssignment" ADD CONSTRAINT "ScholarshipAssignment_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "public"."ScholarshipDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScholarshipAssignment" ADD CONSTRAINT "ScholarshipAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChargeAssignment" ADD CONSTRAINT "ChargeAssignment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "public"."ChargeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChargeAssignment" ADD CONSTRAINT "ChargeAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentFeeHistory" ADD CONSTRAINT "StudentFeeHistory_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentFeeHistory" ADD CONSTRAINT "StudentFeeHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceSession" ADD CONSTRAINT "AttendanceSession_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAuditLog" ADD CONSTRAINT "ComplaintAuditLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAuditLog" ADD CONSTRAINT "ComplaintAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
