/*
  Warnings:

  - You are about to drop the column `duration` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `endpoint` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `errorCode` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `statusCode` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `traceId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `linkedAt` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `ParentStudentLink` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `module` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `grantedAt` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `additionalMetadata` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `employmentDate` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStatus` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `qualification` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `additionalMetadata` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `additionalMetadata` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `employmentDate` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStatus` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `TeacherClass` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `TeacherSubject` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `deviceFingerprint` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `revokeReason` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeacherProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `capacity` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grade` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `allowances` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basicSalary` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContact` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSalary` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admissionDate` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherEmail` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motherEmail` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motherName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Made the column `dob` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContact` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `interests` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `additionalData` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `maxMarks` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passMarks` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joiningDate` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Made the column `designation` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `basicSalary` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `allowances` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalSalary` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_classId_fkey";

-- DropForeignKey
ALTER TABLE "StaffProfile" DROP CONSTRAINT "StaffProfile_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClass" DROP CONSTRAINT "TeacherClass_classId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClass" DROP CONSTRAINT "TeacherClass_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherClass" DROP CONSTRAINT "TeacherClass_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProfile" DROP CONSTRAINT "TeacherProfile_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherSubject" DROP CONSTRAINT "TeacherSubject_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropIndex
DROP INDEX "AuditLog_action_idx";

-- DropIndex
DROP INDEX "AuditLog_module_idx";

-- DropIndex
DROP INDEX "AuditLog_resourceId_idx";

-- DropIndex
DROP INDEX "AuditLog_status_idx";

-- DropIndex
DROP INDEX "AuditLog_timestamp_idx";

-- DropIndex
DROP INDEX "AuditLog_traceId_idx";

-- DropIndex
DROP INDEX "AuditLog_userId_idx";

-- DropIndex
DROP INDEX "Class_createdById_idx";

-- DropIndex
DROP INDEX "Class_deletedById_idx";

-- DropIndex
DROP INDEX "Class_name_idx";

-- DropIndex
DROP INDEX "Class_updatedById_idx";

-- DropIndex
DROP INDEX "ParentStudentLink_createdById_idx";

-- DropIndex
DROP INDEX "ParentStudentLink_deletedById_idx";

-- DropIndex
DROP INDEX "ParentStudentLink_parentId_idx";

-- DropIndex
DROP INDEX "ParentStudentLink_parentId_studentId_key";

-- DropIndex
DROP INDEX "ParentStudentLink_studentId_idx";

-- DropIndex
DROP INDEX "ParentStudentLink_updatedById_idx";

-- DropIndex
DROP INDEX "Permission_code_idx";

-- DropIndex
DROP INDEX "Permission_createdById_idx";

-- DropIndex
DROP INDEX "Permission_deletedById_idx";

-- DropIndex
DROP INDEX "Permission_module_idx";

-- DropIndex
DROP INDEX "Permission_updatedById_idx";

-- DropIndex
DROP INDEX "Role_createdById_idx";

-- DropIndex
DROP INDEX "Role_deletedById_idx";

-- DropIndex
DROP INDEX "Role_updatedById_idx";

-- DropIndex
DROP INDEX "RolePermission_permissionId_idx";

-- DropIndex
DROP INDEX "RolePermission_roleId_idx";

-- DropIndex
DROP INDEX "RolePermission_roleId_permissionId_key";

-- DropIndex
DROP INDEX "Staff_createdById_idx";

-- DropIndex
DROP INDEX "Staff_deletedById_idx";

-- DropIndex
DROP INDEX "Staff_department_idx";

-- DropIndex
DROP INDEX "Staff_employmentStatus_idx";

-- DropIndex
DROP INDEX "Staff_updatedById_idx";

-- DropIndex
DROP INDEX "Staff_userId_idx";

-- DropIndex
DROP INDEX "Student_classId_idx";

-- DropIndex
DROP INDEX "Student_classId_sectionId_rollNumber_key";

-- DropIndex
DROP INDEX "Student_createdById_idx";

-- DropIndex
DROP INDEX "Student_deletedById_idx";

-- DropIndex
DROP INDEX "Student_sectionId_idx";

-- DropIndex
DROP INDEX "Student_updatedById_idx";

-- DropIndex
DROP INDEX "StudentProfile_createdById_idx";

-- DropIndex
DROP INDEX "StudentProfile_deletedById_idx";

-- DropIndex
DROP INDEX "StudentProfile_studentId_idx";

-- DropIndex
DROP INDEX "StudentProfile_updatedById_idx";

-- DropIndex
DROP INDEX "Subject_code_idx";

-- DropIndex
DROP INDEX "Subject_createdById_idx";

-- DropIndex
DROP INDEX "Subject_deletedById_idx";

-- DropIndex
DROP INDEX "Subject_updatedById_idx";

-- DropIndex
DROP INDEX "Teacher_createdById_idx";

-- DropIndex
DROP INDEX "Teacher_deletedById_idx";

-- DropIndex
DROP INDEX "Teacher_employeeId_idx";

-- DropIndex
DROP INDEX "Teacher_updatedById_idx";

-- DropIndex
DROP INDEX "Teacher_userId_idx";

-- DropIndex
DROP INDEX "TeacherClass_classId_idx";

-- DropIndex
DROP INDEX "TeacherClass_createdById_idx";

-- DropIndex
DROP INDEX "TeacherClass_deletedById_idx";

-- DropIndex
DROP INDEX "TeacherClass_sectionId_idx";

-- DropIndex
DROP INDEX "TeacherClass_teacherId_classId_sectionId_key";

-- DropIndex
DROP INDEX "TeacherClass_teacherId_idx";

-- DropIndex
DROP INDEX "TeacherClass_updatedById_idx";

-- DropIndex
DROP INDEX "TeacherSubject_createdById_idx";

-- DropIndex
DROP INDEX "TeacherSubject_deletedById_idx";

-- DropIndex
DROP INDEX "TeacherSubject_subjectId_idx";

-- DropIndex
DROP INDEX "TeacherSubject_teacherId_idx";

-- DropIndex
DROP INDEX "TeacherSubject_teacherId_subjectId_key";

-- DropIndex
DROP INDEX "TeacherSubject_updatedById_idx";

-- DropIndex
DROP INDEX "UserRole_roleId_idx";

-- DropIndex
DROP INDEX "UserRole_userId_idx";

-- DropIndex
DROP INDEX "UserSession_createdById_idx";

-- DropIndex
DROP INDEX "UserSession_deletedById_idx";

-- DropIndex
DROP INDEX "UserSession_expiresAt_idx";

-- DropIndex
DROP INDEX "UserSession_lastActivityAt_idx";

-- DropIndex
DROP INDEX "UserSession_updatedById_idx";

-- DropIndex
DROP INDEX "UserSession_userId_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "duration",
DROP COLUMN "endpoint",
DROP COLUMN "errorCode",
DROP COLUMN "errorMessage",
DROP COLUMN "method",
DROP COLUMN "resourceId",
DROP COLUMN "resourceType",
DROP COLUMN "sessionId",
DROP COLUMN "statusCode",
DROP COLUMN "traceId",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "createdById",
DROP COLUMN "deletedById",
DROP COLUMN "name",
DROP COLUMN "updatedById",
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "classTeacherId" TEXT,
ADD COLUMN     "grade" INTEGER NOT NULL,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "section" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "ParentStudentLink" DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "linkedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "module",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "RolePermission" DROP COLUMN "grantedAt";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "additionalMetadata",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "department",
DROP COLUMN "designation",
DROP COLUMN "employmentDate",
DROP COLUMN "employmentStatus",
DROP COLUMN "experienceYears",
DROP COLUMN "qualification",
DROP COLUMN "salary",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById",
ADD COLUMN     "allowances" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "basicSalary" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "emergencyContact" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "permissions" TEXT[],
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "totalSalary" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "additionalMetadata",
DROP COLUMN "createdById",
DROP COLUMN "deletedById",
DROP COLUMN "sectionId",
DROP COLUMN "updatedById",
ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "admissionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fatherEmail" TEXT NOT NULL,
ADD COLUMN     "fatherName" TEXT NOT NULL,
ADD COLUMN     "fatherOccupation" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "motherEmail" TEXT NOT NULL,
ADD COLUMN     "motherName" TEXT NOT NULL,
ADD COLUMN     "motherOccupation" TEXT,
ADD COLUMN     "motherPhone" TEXT,
ALTER COLUMN "dob" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL;

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "bio",
DROP COLUMN "createdById",
DROP COLUMN "deletedById",
DROP COLUMN "updatedById",
ALTER COLUMN "emergencyContact" SET NOT NULL,
ALTER COLUMN "interests" SET NOT NULL,
ALTER COLUMN "additionalData" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "createdById",
DROP COLUMN "deletedById",
DROP COLUMN "updatedById",
ADD COLUMN     "maxMarks" INTEGER NOT NULL,
ADD COLUMN     "passMarks" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "additionalMetadata",
DROP COLUMN "address",
DROP COLUMN "createdById",
DROP COLUMN "dateOfBirth",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "department",
DROP COLUMN "employmentDate",
DROP COLUMN "employmentStatus",
DROP COLUMN "specialization",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById",
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maritalStatus" TEXT,
ALTER COLUMN "designation" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "basicSalary" SET NOT NULL,
ALTER COLUMN "allowances" SET NOT NULL,
ALTER COLUMN "totalSalary" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeacherClass" DROP COLUMN "assignedAt",
DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "sectionId",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "TeacherSubject" DROP COLUMN "assignedAt",
DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "deletedAt",
DROP COLUMN "deletedById",
DROP COLUMN "deviceFingerprint",
DROP COLUMN "expiresAt",
DROP COLUMN "ipAddress",
DROP COLUMN "lastActivityAt",
DROP COLUMN "revokeReason",
DROP COLUMN "revokedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedById",
DROP COLUMN "userAgent";

-- DropTable
DROP TABLE "Section";

-- DropTable
DROP TABLE "StaffProfile";

-- DropTable
DROP TABLE "TeacherProfile";

-- DropEnum
DROP TYPE "StaffDepartment";

-- DropEnum
DROP TYPE "StaffEmploymentStatus";

-- DropEnum
DROP TYPE "TeacherEmploymentStatus";

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
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
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IDCard" (
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
CREATE TABLE "IDCardTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IDCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_roomNo_key" ON "Classroom"("roomNo");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IDCard" ADD CONSTRAINT "IDCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IDCardTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IDCard" ADD CONSTRAINT "IDCard_issuedForId_fkey" FOREIGN KEY ("issuedForId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
