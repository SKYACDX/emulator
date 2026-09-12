-- CreateTable
CREATE TABLE "DownloadLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharedFileId" TEXT,
    "patchId" TEXT,
    "userId" TEXT,

    CONSTRAINT "DownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DownloadLog_sharedFileId_idx" ON "DownloadLog"("sharedFileId");

-- CreateIndex
CREATE INDEX "DownloadLog_patchId_idx" ON "DownloadLog"("patchId");

-- CreateIndex
CREATE INDEX "DownloadLog_userId_idx" ON "DownloadLog"("userId");

-- AddForeignKey
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_sharedFileId_fkey" FOREIGN KEY ("sharedFileId") REFERENCES "SharedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
