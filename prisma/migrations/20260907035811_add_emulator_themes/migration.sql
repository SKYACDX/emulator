-- CreateTable
CREATE TABLE "EmulatorTheme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shellBackground" TEXT NOT NULL,
    "shellBorder" TEXT NOT NULL,
    "screenBezel" TEXT NOT NULL,
    "dpadColor" TEXT NOT NULL,
    "actionButtonColor" TEXT NOT NULL,
    "shoulderButtonColor" TEXT NOT NULL,
    "dpadPreset" TEXT NOT NULL,
    "actionButtonsPreset" TEXT NOT NULL,
    "shoulderButtonsPreset" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "EmulatorTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmulatorTheme_slug_key" ON "EmulatorTheme"("slug");

-- CreateIndex
CREATE INDEX "EmulatorTheme_system_idx" ON "EmulatorTheme"("system");

-- CreateIndex
CREATE INDEX "EmulatorTheme_authorId_idx" ON "EmulatorTheme"("authorId");

-- AddForeignKey
ALTER TABLE "EmulatorTheme" ADD CONSTRAINT "EmulatorTheme_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
