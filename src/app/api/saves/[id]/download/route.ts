import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { getFileDownloadUrl } from "@/lib/storage";

export async function GET(
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

  const url = await getFileDownloadUrl(save.storedName, save.originalName).catch(() => null);
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  return NextResponse.json({ downloadUrl: url });
}
