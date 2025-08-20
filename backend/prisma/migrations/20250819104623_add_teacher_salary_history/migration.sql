-- CreateEnum
CREATE TYPE "SalaryChangeType" AS ENUM ('INITIAL', 'PROMOTION', 'DEMOTION', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "TeacherSalaryHistory" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "effectiveMonth" DATE NOT NULL,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "changeType" "SalaryChangeType" NOT NULL DEFAULT 'INITIAL',
    "changeReason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "TeacherSalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_teacherId_idx" ON "TeacherSalaryHistory"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_effectiveMonth_idx" ON "TeacherSalaryHistory"("effectiveMonth");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_createdById_idx" ON "TeacherSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_updatedById_idx" ON "TeacherSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_deletedById_idx" ON "TeacherSalaryHistory"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherSalaryHistory_approvedById_idx" ON "TeacherSalaryHistory"("approvedById");

-- AddForeignKey
ALTER TABLE "TeacherSalaryHistory" ADD CONSTRAINT "TeacherSalaryHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSalaryHistory" ADD CONSTRAINT "TeacherSalaryHistory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
