import { NextResponse } from "next/server";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { presignSaveSchema } from "@/lib/validation";
import { createFileUploadUrl, newStoredFileName, maxSaveFileSizeBytes } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = presignSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { filename, fileSize, contentType } = parsed.data;

  if (fileSize > maxSaveFileSizeBytes()) {
    return NextResponse.json({ error: "El archivo es demasiado grande" }, { status: 400 });
  }

  const storedName = newStoredFileName(filename, `saves/${user.id}`);
  const uploadUrl = await createFileUploadUrl(storedName, contentType);

  return NextResponse.json({ uploadUrl, storedName });
}
