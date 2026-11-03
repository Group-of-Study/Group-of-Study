-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "study_group" ADD COLUMN     "visibility" "GroupVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "group_invite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "group_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_invite_code_key" ON "group_invite"("code");

-- CreateIndex
CREATE INDEX "group_invite_groupId_revokedAt_idx" ON "group_invite"("groupId", "revokedAt");

-- CreateIndex
CREATE INDEX "group_invite_createdById_idx" ON "group_invite"("createdById");

-- CreateIndex
CREATE INDEX "group_invite_expiresAt_idx" ON "group_invite"("expiresAt");

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
