-- AlterTable
ALTER TABLE "user" ADD COLUMN     "onboardingDoneAt" TIMESTAMP(3);

-- O onboarding (GOS-040) é para o primeiro acesso: quem já tinha conta antes desta
-- migration não vê o checklist "Primeiros passos".
UPDATE "user" SET "onboardingDoneAt" = NOW() WHERE "onboardingDoneAt" IS NULL;
