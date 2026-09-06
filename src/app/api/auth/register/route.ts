import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!checkRateLimit(`register:${clientIp(request)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "El correo o el nombre de usuario ya está en uso" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true },
  });

  await createSessionCookie(user.id);

  return NextResponse.json({ ok: true });
}
