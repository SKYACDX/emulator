import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/auth";
import { getObjectBuffer, deleteSharedFile } from "@/lib/storage";
import { scanFile, virusScanningEnabled } from "@/lib/virustotal";

/**
 * Re-checks a file stuck in "pending" (or "error") against VirusTotal —
 * nothing re-checks these automatically, since we only poll for a short
 * window at upload time, so this is how staff clears one once VirusTotal
 * has actually finished analyzing it.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!virusScanningEnabled()) {
    return NextResponse.json(
      { error: "El escaneo de VirusTotal no está configurado" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const file = await prisma.sharedFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const buffer = await getObjectBuffer(file.storedName).catch(() => null);
  if (!buffer) {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 500 });
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const verdict = await scanFile(buffer, sha256, file.originalName);

  if (verdict === "malicious") {
    await deleteSharedFile(file.storedName).catch(() => {});
    await prisma.fileReport.deleteMany({ where: { sharedFileId: file.id } });
    await prisma.sharedFile.delete({ where: { id: file.id } });
    return NextResponse.json({ ok: true, verdict, deleted: true });
  }

  await prisma.sharedFile.update({
    where: { id: file.id },
    data: { virusScanStatus: verdict },
  });

  return NextResponse.json({ ok: true, verdict, deleted: false });
}
