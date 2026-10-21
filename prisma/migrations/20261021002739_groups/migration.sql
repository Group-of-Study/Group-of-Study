-- CreateTable
CREATE TABLE "study_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "creatorId" TEXT NOT NULL,
    "leaderId" TEXT,

    CONSTRAINT "study_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_group_creatorId_idx" ON "study_group"("creatorId");

-- CreateIndex
CREATE INDEX "study_group_leaderId_idx" ON "study_group"("leaderId");

-- CreateIndex
CREATE INDEX "study_group_status_idx" ON "study_group"("status");

-- CreateIndex
CREATE INDEX "group_member_groupId_idx" ON "group_member"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_userId_groupId_key" ON "group_member"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
