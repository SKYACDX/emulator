import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromBearerToken } from "@/lib/apiAuth";
import { updateAppListingSchema } from "@/lib/validation";
import { serializeAppListing } from "@/lib/appListing";

const LISTING_SLUG = "multiemu";

/** Creates or updates the one AppListing row (there's only ever one). */
export async function PUT(request: Request) {
  const admin = await getAdminFromBearerToken(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = updateAppListingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await prisma.appListing.findFirst();
  if (!existing && (!parsed.data.tagline || !parsed.data.description)) {
    return NextResponse.json(
      { error: "La primera vez hace falta tagline y description" },
      { status: 400 }
    );
  }

  const listing = existing
    ? await prisma.appListing.update({
        where: { id: existing.id },
        data: parsed.data,
        include: { screenshots: true },
      })
    : await prisma.appListing.create({
        data: {
          slug: LISTING_SLUG,
          name: "multiemu",
          tagline: parsed.data.tagline!,
          description: parsed.data.description!,
          features: parsed.data.features ?? [],
        },
        include: { screenshots: true },
      });

  return NextResponse.json({ listing: await serializeAppListing(listing) });
}
