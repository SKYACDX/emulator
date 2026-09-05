import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { deletePatchFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const hack = await prisma.hack.findUnique({
    where: { id },
    include: { patches: true },
  });
  if (!hack) {
    return NextResponse.json({ error: "Hack no encontrado" }, { status: 404 });
  }

  await Promise.all(
    hack.patches.map((patch) => deletePatchFile(patch.storedName).catch(() => {}))
  );

  await prisma.patch.deleteMany({ where: { hackId: hack.id } });
  await prisma.hack.delete({ where: { id: hack.id } });

  return NextResponse.json({ ok: true });
}
