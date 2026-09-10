-- DropForeignKey
ALTER TABLE "AppFeedback" DROP CONSTRAINT "AppFeedback_authorId_fkey";

-- AlterTable
ALTER TABLE "AppFeedback" ADD COLUMN     "guestName" TEXT,
ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AppFeedback" ADD CONSTRAINT "AppFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
