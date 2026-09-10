import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createFileUploadUrl, newStoredFileName } from "@/lib/storage";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().refine((t) => t.startsWith("image/"), "Debe ser una imagen"),
});

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  const rateLimitKey = user ? `app-feedback-upload:${user.id}` : `app-feedback-upload-guest:${clientIp(request)}`;
  if (!(await checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas subidas, espera un rato" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const storedName = newStoredFileName(parsed.data.filename, `app-feedback/${user?.id ?? "guest"}`);
  const uploadUrl = await createFileUploadUrl(storedName, parsed.data.contentType);
  return NextResponse.json({ uploadUrl, storedName });
}
