import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reportFileSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const { id } = await params;

  const file = await prisma.sharedFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
  if (file.uploaderId === user.id) {
    return NextResponse.json(
      { error: "No puedes reportar tu propio archivo" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reportFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const reason =
    parsed.data.reason === "Otro" && parsed.data.details
      ? `Otro: ${parsed.data.details}`
      : parsed.data.reason;

  await prisma.fileReport.upsert({
    where: {
      sharedFileId_reporterId: { sharedFileId: file.id, reporterId: user.id },
    },
    create: { sharedFileId: file.id, reporterId: user.id, reason },
    update: { reason },
  });

  return NextResponse.json({ ok: true });
}
