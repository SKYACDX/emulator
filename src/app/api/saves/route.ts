import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { createSaveSchema } from "@/lib/validation";
import { headObject, maxSaveFileSizeBytes, deleteSharedFile } from "@/lib/storage";

/** Lists every cloud save for the authenticated account. */
export async function GET(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const saves = await prisma.gameSave.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const origin = new URL(request.url).origin;

  return NextResponse.json({
    saves: saves.map((s) => ({
      id: s.id,
      gameKey: s.gameKey,
      slot: s.slot,
      title: s.title,
      originalName: s.originalName,
      fileSize: s.fileSize,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      downloadUrl: `${origin}/api/saves/${s.id}/download`,
    })),
  });
}

/**
 * Creates or overwrites the save for (gameKey, slot) after the app has
 * already PUT the bytes to the presigned URL from /api/saves/presign.
 */
export async function POST(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { gameKey, slot, storedName, originalName, title } = parsed.data;

  if (!storedName.startsWith(`saves/${user.id}/`)) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const info = await headObject(storedName);
  if (!info) {
    return NextResponse.json(
      { error: "No se encontró el archivo subido. Intenta de nuevo." },
      { status: 400 }
    );
  }
  if (info.size > maxSaveFileSizeBytes()) {
    await deleteSharedFile(storedName).catch(() => {});
    return NextResponse.json({ error: "El archivo es demasiado grande" }, { status: 400 });
  }

  const existing = await prisma.gameSave.findUnique({
    where: { userId_gameKey_slot: { userId: user.id, gameKey, slot } },
  });

  const save = await prisma.gameSave.upsert({
    where: { userId_gameKey_slot: { userId: user.id, gameKey, slot } },
    create: {
      userId: user.id,
      gameKey,
      slot,
      storedName,
      originalName,
      fileSize: info.size,
      title,
    },
    // An upload without a title keeps the one already there: older app
    // versions don't send it and must not wipe what a newer one wrote.
    update: {
      storedName,
      originalName,
      fileSize: info.size,
      ...(title ? { title } : {}),
    },
  });

  // The name belongs to the game, not the slot: give it to every save of that
  // game, so states uploaded before the app sent titles get it too.
  if (title) {
    await prisma.gameSave.updateMany({ where: { userId: user.id, gameKey }, data: { title } });
  }

  if (existing && existing.storedName !== storedName) {
    await deleteSharedFile(existing.storedName).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: save.id, updatedAt: save.updatedAt.toISOString() });
}
