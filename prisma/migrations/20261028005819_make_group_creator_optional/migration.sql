-- DropForeignKey
ALTER TABLE "study_group" DROP CONSTRAINT "study_group_creatorId_fkey";

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
