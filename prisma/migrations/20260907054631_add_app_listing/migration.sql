-- CreateTable
CREATE TABLE "AppListing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "iconKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppScreenshot" (
    "id" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "AppScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "versionCode" INTEGER NOT NULL,
    "changelog" TEXT NOT NULL,
    "minAndroidSdk" INTEGER NOT NULL,
    "apkKey" TEXT,
    "apkSize" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "AppRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppListing_slug_key" ON "AppListing"("slug");

-- CreateIndex
CREATE INDEX "AppScreenshot_listingId_idx" ON "AppScreenshot"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "AppRelease_versionCode_key" ON "AppRelease"("versionCode");

-- CreateIndex
CREATE INDEX "AppRelease_listingId_idx" ON "AppRelease"("listingId");

-- AddForeignKey
ALTER TABLE "AppScreenshot" ADD CONSTRAINT "AppScreenshot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AppListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppRelease" ADD CONSTRAINT "AppRelease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AppListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
