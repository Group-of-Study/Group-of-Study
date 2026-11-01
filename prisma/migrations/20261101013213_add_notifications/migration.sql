-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GROUP_REMOVED', 'BECAME_LEADER', 'GROUP_INVITE');

-- AlterTable
ALTER TABLE "group_invite" ADD COLUMN     "recipientId" TEXT;

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "data" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_readAt_createdAt_idx" ON "notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "group_invite_recipientId_idx" ON "group_invite"("recipientId");

-- AddForeignKey
ALTER TABLE "group_invite" ADD CONSTRAINT "group_invite_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
