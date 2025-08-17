-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "ethnicity" TEXT;

-- CreateIndex
CREATE INDEX "Student_ethnicity_idx" ON "public"."Student"("ethnicity");
