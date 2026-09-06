import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSharedFileSchema } from "@/lib/validation";
import { isBlockedUploadExtension } from "@/lib/fileTypes";
import {
  headObject,
  maxSharedFileSizeBytes,
  deleteSharedFile,
  getObjectBuffer,
} from "@/lib/storage";
import { isAllowedCoverUrl } from "@/lib/thegamesdb";
import { scanFile, virusScanningEnabled, maxScannableSizeBytes } from "@/lib/virustotal";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSharedFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    storedName,
    originalName,
    isPublic,
    platformSlug,
    gameTitle,
    coverImageUrl,
  } = parsed.data;

  if (isBlockedUploadExtension(originalName) || !storedName.startsWith("files/")) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const platform = platformSlug
    ? await prisma.platform.findUnique({ where: { slug: platformSlug } })
    : null;
  if (platformSlug && !platform) {
    return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
  }

  // Never trust client-reported size/type: confirm the object actually
  // landed in R2 and read its real metadata back.
  const info = await headObject(storedName);
  if (!info) {
    return NextResponse.json(
      { error: "No se encontró el archivo subido. Intenta de nuevo." },
      { status: 400 }
    );
  }
  if (info.size > maxSharedFileSizeBytes()) {
    await deleteSharedFile(storedName).catch(() => {});
    return NextResponse.json({ error: "El archivo es demasiado grande" }, { status: 400 });
  }

  let virusScanStatus = "skipped";
  if (virusScanningEnabled() && info.size <= maxScannableSizeBytes()) {
    const buffer = await getObjectBuffer(storedName);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    virusScanStatus = await scanFile(buffer, sha256, originalName);

    if (virusScanStatus === "malicious") {
      await deleteSharedFile(storedName).catch(() => {});
      return NextResponse.json(
        { error: "El archivo fue marcado como malicioso por el escaneo antivirus." },
        { status: 400 }
      );
    }
  }

  const file = await prisma.sharedFile.create({
    data: {
      title,
      description,
      originalName,
      storedName,
      fileSize: info.size,
      mimeType: info.contentType ?? "application/octet-stream",
      isPublic,
      platformId: platform?.id,
      gameTitle: gameTitle || null,
      coverImageUrl: coverImageUrl && isAllowedCoverUrl(coverImageUrl) ? coverImageUrl : null,
      uploaderId: user.id,
      virusScanStatus,
    },
  });

  return NextResponse.json({ ok: true, id: file.id });
}
