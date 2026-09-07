import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight, parsePagination } from "@/lib/cors";
import { serializeAppRelease } from "@/lib/appListing";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { limit, offset } = parsePagination(searchParams);

  const listing = await prisma.appListing.findFirst({ select: { id: true } });
  if (!listing) {
    return corsJson({ releases: [], pagination: { limit, offset, total: 0, hasMore: false } });
  }

  const [releases, total] = await Promise.all([
    prisma.appRelease.findMany({
      where: { listingId: listing.id },
      orderBy: { versionCode: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.appRelease.count({ where: { listingId: listing.id } }),
  ]);

  return corsJson({
    releases: await Promise.all(releases.map(serializeAppRelease)),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + releases.length < total,
    },
  });
}
