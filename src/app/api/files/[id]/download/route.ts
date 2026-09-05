import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
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

  if (!file.isPublic) {
    const user = await getCurrentUser();
    const allowed = user && (user.id === file.uploaderId || user.role === "ADMIN");
    if (!allowed) {
      // 404 instead of 403 so a private file's existence isn't revealed.
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }
  }

  const url = await getFileDownloadUrl(file.storedName, file.originalName).catch(
    () => null
  );
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  return NextResponse.redirect(url);
}
