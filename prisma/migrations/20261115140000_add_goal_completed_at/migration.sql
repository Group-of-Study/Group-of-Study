-- AlterTable
ALTER TABLE "study_goal" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- Metas concluídas antes desta migration: a melhor estimativa é a última alteração.
UPDATE "study_goal" SET "completedAt" = "updatedAt" WHERE "status" = 'COMPLETED' AND "completedAt" IS NULL;
