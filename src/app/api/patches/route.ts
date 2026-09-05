import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addPatchSchema } from "@/lib/validation";
import { formatFromFilename, ALLOWED_PATCH_EXTENSIONS } from "@/lib/patchFormats";
import { savePatchFile, maxPatchSizeBytes } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const parsed = addPatchSchema.safeParse({
    hackId: formData.get("hackId"),
    version: formData.get("version"),
    releaseNotes: formData.get("releaseNotes") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const hack = await prisma.hack.findUnique({ where: { id: parsed.data.hackId } });
  if (!hack) {
    return NextResponse.json({ error: "Hack no encontrado" }, { status: 404 });
  }
  if (hack.authorId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const file = formData.get("patchFile");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Debes adjuntar un archivo de parche" }, { status: 400 });
  }
  if (file.size > maxPatchSizeBytes()) {
    return NextResponse.json({ error: "El archivo de parche es demasiado grande" }, { status: 400 });
  }
  const format = formatFromFilename(file.name);
  if (!format) {
    return NextResponse.json(
      { error: `Formato no soportado. Usa: ${ALLOWED_PATCH_EXTENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storedName, sha256 } = await savePatchFile(buffer, file.name);

  await prisma.patch.create({
    data: {
      hackId: hack.id,
      version: parsed.data.version,
      releaseNotes: parsed.data.releaseNotes,
      format,
      originalName: file.name,
      storedName,
      fileSize: file.size,
      sha256,
    },
  });

  return NextResponse.json({ ok: true });
}
