-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "citizenshipNumber" TEXT,
ADD COLUMN     "panNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."Teacher" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "citizenshipNumber" TEXT,
ADD COLUMN     "panNumber" TEXT;
