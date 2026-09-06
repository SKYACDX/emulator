-- AlterTable
ALTER TABLE "SharedFile" ADD COLUMN     "gameTitle" TEXT,
ADD COLUMN     "platformId" TEXT;

-- CreateIndex
CREATE INDEX "SharedFile_platformId_idx" ON "SharedFile"("platformId");

-- AddForeignKey
ALTER TABLE "SharedFile" ADD CONSTRAINT "SharedFile_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;
