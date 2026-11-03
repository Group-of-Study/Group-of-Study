-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "study_goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "study_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_goal_groupId_status_idx" ON "study_goal"("groupId", "status");

-- CreateIndex
CREATE INDEX "study_goal_authorId_idx" ON "study_goal"("authorId");

-- AddForeignKey
ALTER TABLE "study_goal" ADD CONSTRAINT "study_goal_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_goal" ADD CONSTRAINT "study_goal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
