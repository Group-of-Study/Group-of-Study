-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- AlterTable
ALTER TABLE "study_group"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "study_group"
ALTER COLUMN "status" TYPE "GroupStatus"
USING ("status"::"GroupStatus");

ALTER TABLE "study_group"
ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"GroupStatus";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study_group_status_idx"
ON "study_group"("status");