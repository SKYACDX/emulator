import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatchDownloadUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
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

  await prisma.patch.update({ where: { id }, data: { downloadCount: { increment: 1 } } });

  return NextResponse.redirect(url);
}
