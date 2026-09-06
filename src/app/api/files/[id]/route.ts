import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteSharedFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
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

  if (
    file.uploaderId !== user.id &&
    user.role !== "ADMIN" &&
    user.role !== "MODERATOR"
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await deleteSharedFile(file.storedName).catch(() => {});
  await prisma.fileReport.deleteMany({ where: { sharedFileId: file.id } });
  await prisma.sharedFile.delete({ where: { id: file.id } });

  return NextResponse.json({ ok: true });
}
