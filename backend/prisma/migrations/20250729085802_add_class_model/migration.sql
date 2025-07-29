-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherClass" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "TeacherClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_section_idx" ON "Class"("section");

-- CreateIndex
CREATE INDEX "TeacherClass_teacherId_idx" ON "TeacherClass"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherClass_classId_idx" ON "TeacherClass"("classId");

-- CreateIndex
CREATE INDEX "TeacherClass_createdById_idx" ON "TeacherClass"("createdById");

-- CreateIndex
CREATE INDEX "TeacherClass_updatedById_idx" ON "TeacherClass"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherClass_deletedById_idx" ON "TeacherClass"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClass_teacherId_classId_key" ON "TeacherClass"("teacherId", "classId");

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClass" ADD CONSTRAINT "TeacherClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
