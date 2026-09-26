-- AlterTable
ALTER TABLE "AppScreenshot" ADD COLUMN     "platform" "AppPlatform" NOT NULL DEFAULT 'ANDROID';

-- CreateIndex
CREATE INDEX "AppScreenshot_listingId_platform_idx" ON "AppScreenshot"("listingId", "platform");
