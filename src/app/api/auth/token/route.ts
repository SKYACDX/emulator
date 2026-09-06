import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signTotpPendingToken } from "@/lib/auth";
import { issueApiToken } from "@/lib/apiAuth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const schema = loginSchema.extend({
  label: z.string().trim().max(100).optional(),
});

/**
 * Login for the companion emulator app: same credential check as the web
 * login, but issues a long-lived bearer token instead of a cookie (native
 * apps don't have a good place to keep an httpOnly cookie). If 2FA is
 * enabled, mirrors the web flow — returns a pendingToken to finish at
 * POST /api/auth/token/verify.
 */
export async function POST(request: Request) {
  if (!(await checkRateLimit(`token-login:${clientIp(request)}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { email, password, label } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  if (user.totpEnabled) {
    const pendingToken = signTotpPendingToken(user.id);
    return NextResponse.json({ ok: true, requiresTotp: true, pendingToken });
  }

  const token = await issueApiToken(user.id, label);
  return NextResponse.json({ ok: true, token, username: user.username });
}
