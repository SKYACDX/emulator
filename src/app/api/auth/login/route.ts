import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionCookie, signTotpPendingToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { recordLoginAttempt } from "@/lib/loginAttempts";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!(await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

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
    await recordLoginAttempt({
      email,
      success: false,
      method: "password",
      ip,
      userAgent,
      userId: user?.id,
    });
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    );
  }

  if (user.totpEnabled) {
    // Not a full login yet — /api/auth/totp/verify-login records the
    // actual outcome once the second factor is checked.
    const pendingToken = signTotpPendingToken(user.id);
    return NextResponse.json({ ok: true, requiresTotp: true, pendingToken });
  }

  await createSessionCookie(user.id);
  await recordLoginAttempt({ email, success: true, method: "password", ip, userAgent, userId: user.id });

  return NextResponse.json({ ok: true });
}
