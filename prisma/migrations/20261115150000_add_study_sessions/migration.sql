-- CreateTable
CREATE TABLE "study_session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "study_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_session_groupId_startsAt_idx" ON "study_session"("groupId", "startsAt");

-- CreateIndex
CREATE INDEX "study_session_createdById_idx" ON "study_session"("createdById");

-- AddForeignKey
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

