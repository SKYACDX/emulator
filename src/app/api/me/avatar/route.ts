import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createFileUploadUrl, newStoredFileName, headObject, getAvatarUrl } from "@/lib/storage";

const presignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().refine((t) => t.startsWith("image/"), "Debe ser una imagen"),
});

const MAX_AVATAR_BYTES = 5_000_000;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = presignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const storedName = newStoredFileName(parsed.data.filename, `avatars/${user.id}`);
  const uploadUrl = await createFileUploadUrl(storedName, parsed.data.contentType);
  return NextResponse.json({ uploadUrl, storedName });
}

const confirmSchema = z.object({ storedName: z.string().min(1) });

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.storedName.startsWith(`avatars/${user.id}/`)) {
    return NextResponse.json({ error: "Archivo no permitido" }, { status: 400 });
  }

  const info = await headObject(parsed.data.storedName);
  if (!info || info.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Imagen inválida o demasiado grande" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarKey: parsed.data.storedName },
  });

  return NextResponse.json({ ok: true, avatarUrl: await getAvatarUrl(parsed.data.storedName) });
}
