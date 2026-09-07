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

  const release = await prisma.appRelease
    .create({
      data: { ...parsed.data, listingId: listing.id },
    })
    .catch(() => null);

  if (!release) {
    return NextResponse.json({ error: "Ya existe una versión con ese versionCode" }, { status: 409 });
  }

  return NextResponse.json({ release: await serializeAppRelease(release) }, { status: 201 });
}
