-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "building" TEXT,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "floor" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" UUID;

-- CreateIndex
CREATE INDEX "Classroom_createdById_idx" ON "Classroom"("createdById");

-- CreateIndex
CREATE INDEX "Classroom_updatedById_idx" ON "Classroom"("updatedById");

-- CreateIndex
CREATE INDEX "Classroom_deletedById_idx" ON "Classroom"("deletedById");

-- CreateIndex
CREATE INDEX "Classroom_status_idx" ON "Classroom"("status");

-- CreateIndex
CREATE INDEX "Classroom_isAvailable_idx" ON "Classroom"("isAvailable");
