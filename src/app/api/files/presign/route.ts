import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { presignFileSchema } from "@/lib/validation";
import { isBlockedUploadExtension } from "@/lib/fileTypes";
import { createFileUploadUrl, newStoredFileName, maxSharedFileSizeBytes } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = presignFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { filename, fileSize, contentType } = parsed.data;

  if (isBlockedUploadExtension(filename)) {
    return NextResponse.json(
      {
        error:
          "Ese tipo de archivo no está permitido (videos y volcados de ROM/ISO están bloqueados).",
      },
      { status: 400 }
    );
  }

  if (fileSize > maxSharedFileSizeBytes()) {
    return NextResponse.json(
      { error: "El archivo es demasiado grande" },
      { status: 400 }
    );
  }

  const storedName = newStoredFileName(filename, "files");
  const uploadUrl = await createFileUploadUrl(storedName, contentType);

  return NextResponse.json({ uploadUrl, storedName });
}
