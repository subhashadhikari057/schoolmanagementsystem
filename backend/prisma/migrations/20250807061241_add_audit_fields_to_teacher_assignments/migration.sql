-- AlterTable
ALTER TABLE "TeacherClass" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedById" UUID;

-- AlterTable
ALTER TABLE "TeacherSubject" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" UUID;

-- CreateIndex
CREATE INDEX "TeacherClass_createdById_idx" ON "TeacherClass"("createdById");

-- CreateIndex
CREATE INDEX "TeacherClass_updatedById_idx" ON "TeacherClass"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherClass_deletedById_idx" ON "TeacherClass"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherSubject_createdById_idx" ON "TeacherSubject"("createdById");

-- CreateIndex
CREATE INDEX "TeacherSubject_updatedById_idx" ON "TeacherSubject"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherSubject_deletedById_idx" ON "TeacherSubject"("deletedById");
