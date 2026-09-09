import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createContactMessageSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!(await checkRateLimit(`contact:${clientIp(request)}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados mensajes, espera un rato" }, { status: 429 });
  }

  const parsed = createContactMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  await prisma.contactMessage.create({ data: parsed.data });

  return NextResponse.json({ ok: true });
}
