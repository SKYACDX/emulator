import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatchDownloadUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { clientIp } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const patch = await prisma.patch.findUnique({
    where: { id },
    include: { hack: true },
  });
  if (!patch) {
    return NextResponse.json({ error: "Parche no encontrado" }, { status: 404 });
  }

  const downloadName = `${patch.hack.slug}-v${patch.version}.${patch.format.toLowerCase()}`;

  const url = await getPatchDownloadUrl(patch.storedName, downloadName).catch(
    () => null
  );
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  const user = await getCurrentUser();
  await prisma.patch.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
  await prisma.downloadLog.create({
    data: {
      patchId: id,
      userId: user?.id ?? null,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.redirect(url);
}
