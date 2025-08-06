-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "employmentDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "address" TEXT,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentDate" TIMESTAMP(3),
ADD COLUMN     "employmentStatus" TEXT DEFAULT 'active',
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "TeacherClass" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
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
CREATE TABLE "StaffProfile" (
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

-- CreateIndex
CREATE INDEX "Section_createdById_idx" ON "Section"("createdById");

-- CreateIndex
CREATE INDEX "Section_updatedById_idx" ON "Section"("updatedById");

-- CreateIndex
CREATE INDEX "Section_deletedById_idx" ON "Section"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Section_classId_name_key" ON "Section"("classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_teacherId_key" ON "TeacherProfile"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_staffId_key" ON "StaffProfile"("staffId");

-- CreateIndex
CREATE INDEX "Class_createdById_idx" ON "Class"("createdById");

-- CreateIndex
CREATE INDEX "Class_updatedById_idx" ON "Class"("updatedById");

-- CreateIndex
CREATE INDEX "Class_deletedById_idx" ON "Class"("deletedById");

-- CreateIndex
CREATE INDEX "Staff_createdById_idx" ON "Staff"("createdById");

-- CreateIndex
CREATE INDEX "Staff_updatedById_idx" ON "Staff"("updatedById");

-- CreateIndex
CREATE INDEX "Staff_deletedById_idx" ON "Staff"("deletedById");

-- CreateIndex
CREATE INDEX "Subject_createdById_idx" ON "Subject"("createdById");

-- CreateIndex
CREATE INDEX "Subject_updatedById_idx" ON "Subject"("updatedById");

-- CreateIndex
CREATE INDEX "Subject_deletedById_idx" ON "Subject"("deletedById");

-- CreateIndex
CREATE INDEX "Teacher_createdById_idx" ON "Teacher"("createdById");

-- CreateIndex
CREATE INDEX "Teacher_updatedById_idx" ON "Teacher"("updatedById");

-- CreateIndex
CREATE INDEX "Teacher_deletedById_idx" ON "Teacher"("deletedById");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
