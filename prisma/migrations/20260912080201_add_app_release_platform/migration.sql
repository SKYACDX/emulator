-- CreateEnum
CREATE TYPE "AppPlatform" AS ENUM ('ANDROID', 'WINDOWS');

-- AlterTable
ALTER TABLE "AppRelease" ADD COLUMN     "platform" "AppPlatform" NOT NULL DEFAULT 'ANDROID',
ALTER COLUMN "minAndroidSdk" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AppRelease_listingId_platform_idx" ON "AppRelease"("listingId", "platform");
