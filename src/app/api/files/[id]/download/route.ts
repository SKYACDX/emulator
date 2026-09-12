import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFileDownloadUrl } from "@/lib/storage";
import { clientIp } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const file = await prisma.sharedFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const scanCleared = file.virusScanStatus === "clean" || file.virusScanStatus === "skipped";
  const user = await getCurrentUser();

  if (!file.isPublic || !scanCleared) {
    const isOwnerOrStaff =
      user &&
      (user.id === file.uploaderId || user.role === "ADMIN" || user.role === "MODERATOR");
    if (!isOwnerOrStaff) {
      // 404 instead of 403 so a private/not-yet-cleared file's existence
      // isn't revealed to anyone but its owner and staff.
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }
  }

  const url = await getFileDownloadUrl(file.storedName, file.originalName).catch(
    () => null
  );
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  await prisma.sharedFile.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
  await prisma.downloadLog.create({
    data: {
      sharedFileId: id,
      userId: user?.id ?? null,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.redirect(url);
}
