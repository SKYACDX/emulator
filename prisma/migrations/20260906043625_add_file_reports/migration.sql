-- CreateTable
CREATE TABLE "FileReport" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharedFileId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,

    CONSTRAINT "FileReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileReport_sharedFileId_idx" ON "FileReport"("sharedFileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileReport_sharedFileId_reporterId_key" ON "FileReport"("sharedFileId", "reporterId");

-- AddForeignKey
ALTER TABLE "FileReport" ADD CONSTRAINT "FileReport_sharedFileId_fkey" FOREIGN KEY ("sharedFileId") REFERENCES "SharedFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReport" ADD CONSTRAINT "FileReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
