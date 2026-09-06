-- AlterTable
ALTER TABLE "Patch" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SharedFile" ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0;
