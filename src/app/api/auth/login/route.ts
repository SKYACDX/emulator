import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionCookie, signTotpPendingToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    );
  }

  if (user.totpEnabled) {
    const pendingToken = signTotpPendingToken(user.id);
    return NextResponse.json({ ok: true, requiresTotp: true, pendingToken });
  }

  await createSessionCookie(user.id);

  return NextResponse.json({ ok: true });
}
