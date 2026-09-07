import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromBearerToken } from "@/lib/apiAuth";
import { registerAppAssetSchema } from "@/lib/validation";
import { headObject, deleteSharedFile, maxSharedFileSizeBytes } from "@/lib/storage";
import { serializeAppListing, serializeAppRelease } from "@/lib/appListing";

const MAX_ICON_BYTES = 2_000_000;
const MAX_SCREENSHOT_BYTES = 5_000_000;

export async function POST(request: Request) {
  const admin = await getAdminFromBearerToken(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = registerAppAssetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { slot, storedName } = parsed.data;

  if (!storedName.startsWith(`app-assets/${slot.replace(/[^a-z0-9:-]/gi, "_")}/`)) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const info = await headObject(storedName);
  if (!info) {
    return NextResponse.json(
      { error: "No se encontró el archivo subido. Intenta de nuevo." },
      { status: 400 }
    );
  }

  const listing = await prisma.appListing.findFirst({ include: { screenshots: true } });
  if (!listing) {
    return NextResponse.json(
      { error: "Crea la ficha de la app primero (PUT /api/app)" },
      { status: 400 }
    );
  }

  if (slot === "icon") {
    if (info.size > MAX_ICON_BYTES) {
      await deleteSharedFile(storedName).catch(() => {});
      return NextResponse.json({ error: "El ícono es demasiado grande (máx. 2MB)" }, { status: 400 });
    }
    if (listing.iconKey) await deleteSharedFile(listing.iconKey).catch(() => {});
    const updated = await prisma.appListing.update({
      where: { id: listing.id },
      data: { iconKey: storedName },
      include: { screenshots: true },
    });
    return NextResponse.json({ listing: await serializeAppListing(updated) });
  }

  if (slot === "screenshot") {
    if (info.size > MAX_SCREENSHOT_BYTES) {
      await deleteSharedFile(storedName).catch(() => {});
      return NextResponse.json({ error: "La captura es demasiado grande (máx. 5MB)" }, { status: 400 });
    }
    await prisma.appScreenshot.create({ data: { listingId: listing.id, storedName } });
    const updated = await prisma.appListing.findUnique({
      where: { id: listing.id },
      include: { screenshots: true },
    });
    return NextResponse.json({ listing: await serializeAppListing(updated!) });
  }

  if (slot.startsWith("apk:")) {
    const releaseId = slot.slice("apk:".length);
    const release = await prisma.appRelease.findUnique({ where: { id: releaseId } });
    if (!release || release.listingId !== listing.id) {
      await deleteSharedFile(storedName).catch(() => {});
      return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    }
    if (info.size > maxSharedFileSizeBytes()) {
      await deleteSharedFile(storedName).catch(() => {});
      return NextResponse.json({ error: "El APK es demasiado grande" }, { status: 400 });
    }
    if (release.apkKey) await deleteSharedFile(release.apkKey).catch(() => {});
    const updated = await prisma.appRelease.update({
      where: { id: releaseId },
      data: { apkKey: storedName, apkSize: info.size },
    });
    return NextResponse.json({ release: await serializeAppRelease(updated) });
  }

  return NextResponse.json({ error: "Slot inválido" }, { status: 400 });
}
