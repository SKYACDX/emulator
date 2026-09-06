import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { deleteSharedFile } from "@/lib/storage";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const save = await prisma.gameSave.findUnique({ where: { id } });
  if (!save || save.userId !== user.id) {
    return NextResponse.json({ error: "Guardado no encontrado" }, { status: 404 });
  }

  await deleteSharedFile(save.storedName).catch(() => {});
  await prisma.gameSave.delete({ where: { id: save.id } });

  return NextResponse.json({ ok: true });
}
