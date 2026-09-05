import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFileDownloadUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const file = await prisma.sharedFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const url = await getFileDownloadUrl(file.storedName, file.originalName).catch(
    () => null
  );
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  return NextResponse.redirect(url);
}
