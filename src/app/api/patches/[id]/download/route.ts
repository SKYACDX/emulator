import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readPatchFile } from "@/lib/storage";

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

  const buffer = await readPatchFile(patch.storedName).catch(() => null);
  if (!buffer) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  const downloadName = `${patch.hack.slug}-v${patch.version}.${patch.format.toLowerCase()}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
