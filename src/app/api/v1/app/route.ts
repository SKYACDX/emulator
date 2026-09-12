import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";
import { serializeAppListing, serializeAppRelease } from "@/lib/appListing";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const listing = await prisma.appListing.findFirst({ include: { screenshots: true } });
  if (!listing) {
    return corsJson({ error: "Todavía no hay ficha publicada" }, { status: 404, cache: false });
  }

  // Filtered to ANDROID specifically: this is the update-check endpoint the
  // native Android app polls, so a published WINDOWS release must never
  // show up here as "the latest version".
  const latestRelease = await prisma.appRelease.findFirst({
    where: { listingId: listing.id, platform: "ANDROID" },
    orderBy: { versionCode: "desc" },
  });

  return corsJson({
    listing: await serializeAppListing(listing),
    latestRelease: latestRelease ? await serializeAppRelease(latestRelease) : null,
  });
}
