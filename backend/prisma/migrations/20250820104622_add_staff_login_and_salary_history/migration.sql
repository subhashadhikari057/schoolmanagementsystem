-- AlterTable
ALTER TABLE "Staff" 
ADD COLUMN "userId" TEXT,
ADD COLUMN "employeeId" TEXT,
ADD COLUMN "joiningDate" TIMESTAMP(3),
ADD CONSTRAINT "Staff_userId_key" UNIQUE ("userId"),
ADD CONSTRAINT "Staff_employeeId_key" UNIQUE ("employeeId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Using existing SalaryChangeType enum

-- CreateTable
CREATE TABLE "StaffSalaryHistory" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
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

    CONSTRAINT "StaffSalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_staffId_idx" ON "StaffSalaryHistory"("staffId");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_effectiveMonth_idx" ON "StaffSalaryHistory"("effectiveMonth");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_createdById_idx" ON "StaffSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_updatedById_idx" ON "StaffSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_deletedById_idx" ON "StaffSalaryHistory"("deletedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_approvedById_idx" ON "StaffSalaryHistory"("approvedById");

-- AddForeignKey
ALTER TABLE "StaffSalaryHistory" ADD CONSTRAINT "StaffSalaryHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalaryHistory" ADD CONSTRAINT "StaffSalaryHistory_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
