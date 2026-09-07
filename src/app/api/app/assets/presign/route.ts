import { NextResponse } from "next/server";
import { getAdminFromBearerToken } from "@/lib/apiAuth";
import { presignAppAssetSchema } from "@/lib/validation";
import { createFileUploadUrl, newStoredFileName } from "@/lib/storage";

export async function POST(request: Request) {
  const admin = await getAdminFromBearerToken(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = presignAppAssetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { slot, filename, contentType } = parsed.data;
  const prefix = `app-assets/${slot.replace(/[^a-z0-9:-]/gi, "_")}`;
  const storedName = newStoredFileName(filename, prefix);
  const uploadUrl = await createFileUploadUrl(storedName, contentType);

  return NextResponse.json({ uploadUrl, storedName });
}
