import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromBearerToken } from "@/lib/apiAuth";
import { createAppReleaseSchema } from "@/lib/validation";
import { serializeAppRelease } from "@/lib/appListing";

export async function POST(request: Request) {
  const admin = await getAdminFromBearerToken(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const listing = await prisma.appListing.findFirst();
  if (!listing) {
    return NextResponse.json(
      { error: "Crea la ficha de la app primero (PUT /api/app)" },
      { status: 400 }
    );
  }

  const parsed = createAppReleaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // Carry the running total forward instead of starting a new version at
  // 0 — "downloads" on the page reads as overall app popularity, not
  // per-APK-file hits, so publishing an update shouldn't visibly reset it.
  const { _sum } = await prisma.appRelease.aggregate({
    where: { listingId: listing.id },
    _sum: { downloads: true },
  });

  const release = await prisma.appRelease
    .create({
      data: { ...parsed.data, listingId: listing.id, downloads: _sum.downloads ?? 0 },
    })
    .catch(() => null);

  if (!release) {
    return NextResponse.json({ error: "Ya existe una versión con ese versionCode" }, { status: 409 });
  }

  return NextResponse.json({ release: await serializeAppRelease(release) }, { status: 201 });
}
