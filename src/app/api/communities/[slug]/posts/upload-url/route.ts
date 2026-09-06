import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createFileUploadUrl, newStoredFileName } from "@/lib/storage";

const schema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().refine((t) => t.startsWith("image/"), "Debe ser una imagen"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const storedName = newStoredFileName(parsed.data.filename, `community-posts/${user.id}`);
  const uploadUrl = await createFileUploadUrl(storedName, parsed.data.contentType);
  return NextResponse.json({ uploadUrl, storedName });
}
