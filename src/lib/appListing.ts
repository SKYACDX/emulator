import type { AppListing, AppRelease, AppScreenshot } from "@/generated/prisma/client";
import { getAvatarUrl, getFileDownloadUrl } from "@/lib/storage";

type ListingWithScreenshots = AppListing & { screenshots: AppScreenshot[] };

export async function serializeAppListing(listing: ListingWithScreenshots) {
  return {
    slug: listing.slug,
    name: listing.name,
    tagline: listing.tagline,
    description: listing.description,
    features: listing.features,
    iconUrl: listing.iconKey ? await getAvatarUrl(listing.iconKey) : null,
    screenshots: await Promise.all(listing.screenshots.map((s) => getAvatarUrl(s.storedName))),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export async function serializeAppRelease(release: AppRelease) {
  const ext = release.platform === "WINDOWS" ? "exe" : "apk";
  return {
    id: release.id,
    version: release.version,
    versionCode: release.versionCode,
    changelog: release.changelog,
    platform: release.platform,
    minAndroidSdk: release.minAndroidSdk,
    apkUrl: release.apkKey
      ? await getFileDownloadUrl(release.apkKey, `multiemu-${release.version}.${ext}`)
      : null,
    apkSize: release.apkSize,
    downloads: release.downloads,
    publishedAt: release.publishedAt.toISOString(),
  };
}
