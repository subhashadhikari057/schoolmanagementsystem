-- CreateEnum
CREATE TYPE "TeacherEmploymentStatus" AS ENUM ('active', 'on_leave', 'resigned', 'terminated');

-- CreateEnum
CREATE TYPE "StaffEmploymentStatus" AS ENUM ('active', 'on_leave', 'resigned', 'terminated');

-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM ('administration', 'finance', 'hr', 'maintenance', 'security', 'library', 'canteen', 'transport', 'it_support', 'academic_support');

-- CreateTable
CREATE TABLE "User" (
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
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "revokeReason" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traceId" TEXT,
    "sessionId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "employmentDate" TIMESTAMP(3),
    "employmentStatus" "TeacherEmploymentStatus" NOT NULL DEFAULT 'active',
    "department" TEXT,
    "experienceYears" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "bloodGroup" TEXT,
    "address" TEXT,
    "basicSalary" DECIMAL(10,2),
    "allowances" DECIMAL(10,2),
    "totalSalary" DECIMAL(10,2),
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
    "languagesKnown" JSONB DEFAULT '[]',
    "certifications" TEXT,
    "previousExperience" TEXT,
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "contactInfo" JSONB NOT NULL DEFAULT '{}',
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "additionalData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherClass" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "emergencyContact" JSONB DEFAULT '{}',
    "interests" JSONB DEFAULT '{}',
    "additionalData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentStudentLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "studentId" TEXT NOT NULL,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "qualification" TEXT,
    "employmentDate" TIMESTAMP(3),
    "employmentStatus" "StaffEmploymentStatus" NOT NULL DEFAULT 'active',
    "department" "StaffDepartment",
    "experienceYears" INTEGER,
    "salary" DECIMAL(10,2),
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "emergencyContact" JSONB NOT NULL DEFAULT '{}',
    "address" JSONB NOT NULL DEFAULT '{}',
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "additionalData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_createdById_idx" ON "User"("createdById");

-- CreateIndex
CREATE INDEX "User_updatedById_idx" ON "User"("updatedById");

-- CreateIndex
CREATE INDEX "User_deletedById_idx" ON "User"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Role_createdById_idx" ON "Role"("createdById");

-- CreateIndex
CREATE INDEX "Role_updatedById_idx" ON "Role"("updatedById");

-- CreateIndex
CREATE INDEX "Role_deletedById_idx" ON "Role"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_code_idx" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

-- CreateIndex
CREATE INDEX "Permission_createdById_idx" ON "Permission"("createdById");

-- CreateIndex
CREATE INDEX "Permission_updatedById_idx" ON "Permission"("updatedById");

-- CreateIndex
CREATE INDEX "Permission_deletedById_idx" ON "Permission"("deletedById");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_lastActivityAt_idx" ON "UserSession"("lastActivityAt");

-- CreateIndex
CREATE INDEX "UserSession_createdById_idx" ON "UserSession"("createdById");

-- CreateIndex
CREATE INDEX "UserSession_updatedById_idx" ON "UserSession"("updatedById");

-- CreateIndex
CREATE INDEX "UserSession_deletedById_idx" ON "UserSession"("deletedById");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_traceId_idx" ON "AuditLog"("traceId");

-- CreateIndex
CREATE INDEX "AuditLog_status_idx" ON "AuditLog"("status");

-- CreateIndex
CREATE INDEX "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_userId_idx" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_employeeId_idx" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "Teacher_createdById_idx" ON "Teacher"("createdById");

-- CreateIndex
CREATE INDEX "Teacher_updatedById_idx" ON "Teacher"("updatedById");

-- CreateIndex
CREATE INDEX "Teacher_deletedById_idx" ON "Teacher"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_teacherId_key" ON "TeacherProfile"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherProfile_teacherId_idx" ON "TeacherProfile"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherProfile_createdById_idx" ON "TeacherProfile"("createdById");

-- CreateIndex
CREATE INDEX "TeacherProfile_updatedById_idx" ON "TeacherProfile"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherProfile_deletedById_idx" ON "TeacherProfile"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_code_idx" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_createdById_idx" ON "Subject"("createdById");

-- CreateIndex
CREATE INDEX "Subject_updatedById_idx" ON "Subject"("updatedById");

-- CreateIndex
CREATE INDEX "Subject_deletedById_idx" ON "Subject"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherSubject_teacherId_idx" ON "TeacherSubject"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSubject_subjectId_idx" ON "TeacherSubject"("subjectId");

-- CreateIndex
CREATE INDEX "TeacherSubject_createdById_idx" ON "TeacherSubject"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSubject_updatedById_idx" ON "TeacherSubject"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSubject_deletedById_idx" ON "TeacherSubject"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_key" ON "TeacherSubject"("teacherId", "subjectId");

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_createdById_idx" ON "Class"("createdById");

-- CreateIndex
CREATE INDEX "Class_updatedById_idx" ON "Class"("updatedById");

-- CreateIndex
CREATE INDEX "Class_deletedById_idx" ON "Class"("deletedById");

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "Section"("classId");

-- CreateIndex
CREATE INDEX "Section_createdById_idx" ON "Section"("createdById");

-- CreateIndex
CREATE INDEX "Section_updatedById_idx" ON "Section"("updatedById");

-- CreateIndex
CREATE INDEX "Section_deletedById_idx" ON "Section"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherClass_teacherId_idx" ON "TeacherClass"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherClass_classId_idx" ON "TeacherClass"("classId");

-- CreateIndex
CREATE INDEX "TeacherClass_sectionId_idx" ON "TeacherClass"("sectionId");

-- CreateIndex
CREATE INDEX "TeacherClass_createdById_idx" ON "TeacherClass"("createdById");

-- CreateIndex
CREATE INDEX "TeacherClass_updatedById_idx" ON "TeacherClass"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherClass_deletedById_idx" ON "TeacherClass"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClass_teacherId_classId_sectionId_key" ON "TeacherClass"("teacherId", "classId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_userId_idx" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");

-- CreateIndex
CREATE INDEX "Student_createdById_idx" ON "Student"("createdById");

-- CreateIndex
CREATE INDEX "Student_updatedById_idx" ON "Student"("updatedById");

-- CreateIndex
CREATE INDEX "Student_deletedById_idx" ON "Student"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_sectionId_rollNumber_key" ON "Student"("classId", "sectionId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentProfile_studentId_idx" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentProfile_createdById_idx" ON "StudentProfile"("createdById");

-- CreateIndex
CREATE INDEX "StudentProfile_updatedById_idx" ON "StudentProfile"("updatedById");

-- CreateIndex
CREATE INDEX "StudentProfile_deletedById_idx" ON "StudentProfile"("deletedById");

-- CreateIndex
CREATE INDEX "ParentStudentLink_parentId_idx" ON "ParentStudentLink"("parentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_studentId_idx" ON "ParentStudentLink"("studentId");

-- CreateIndex
CREATE INDEX "ParentStudentLink_createdById_idx" ON "ParentStudentLink"("createdById");

-- CreateIndex
CREATE INDEX "ParentStudentLink_updatedById_idx" ON "ParentStudentLink"("updatedById");

-- CreateIndex
CREATE INDEX "ParentStudentLink_deletedById_idx" ON "ParentStudentLink"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_parentId_studentId_key" ON "ParentStudentLink"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_department_idx" ON "Staff"("department");

-- CreateIndex
CREATE INDEX "Staff_employmentStatus_idx" ON "Staff"("employmentStatus");

-- CreateIndex
CREATE INDEX "Staff_createdById_idx" ON "Staff"("createdById");

-- CreateIndex
CREATE INDEX "Staff_updatedById_idx" ON "Staff"("updatedById");

-- CreateIndex
CREATE INDEX "Staff_deletedById_idx" ON "Staff"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE INDEX "StaffProfile_staffId_idx" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE INDEX "StaffProfile_createdById_idx" ON "StaffProfile"("createdById");

-- CreateIndex
CREATE INDEX "StaffProfile_updatedById_idx" ON "StaffProfile"("updatedById");

-- CreateIndex
CREATE INDEX "StaffProfile_deletedById_idx" ON "StaffProfile"("deletedById");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
