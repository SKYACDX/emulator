import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFileDownloadUrl } from "@/lib/storage";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkRateLimit(`app-release-download-web:${clientIp(request)}`, 20, 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const { id } = await params;
  const release = await prisma.appRelease.findUnique({ where: { id } });
  if (!release || !release.apkKey) {
    return NextResponse.json({ error: "APK no disponible" }, { status: 404 });
  }

  const url = await getFileDownloadUrl(release.apkKey, `multiemu-${release.version}.apk`).catch(
    () => null
  );
  if (!url) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  await prisma.appRelease.update({ where: { id }, data: { downloads: { increment: 1 } } });

  return NextResponse.redirect(url);
}
