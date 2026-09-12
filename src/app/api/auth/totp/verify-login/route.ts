import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, verifyTotpPendingToken } from "@/lib/auth";
import { decryptSecret, verifyTotpToken } from "@/lib/totp";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { recordLoginAttempt } from "@/lib/loginAttempts";

const schema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!(await checkRateLimit(`totp-login:${ip}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const userId = verifyTotpPendingToken(parsed.data.pendingToken);
  if (!userId) {
    return NextResponse.json(
      { error: "La sesión de verificación expiró, inicia sesión de nuevo" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const secret = decryptSecret(user.totpSecret);
  if (!(await verifyTotpToken(parsed.data.code, secret))) {
    await recordLoginAttempt({
      email: user.email,
      success: false,
      method: "totp",
      ip,
      userAgent,
      userId: user.id,
    });
    return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
  }

  await createSessionCookie(user.id);
  await recordLoginAttempt({
    email: user.email,
    success: true,
    method: "totp",
    ip,
    userAgent,
    userId: user.id,
  });

  return NextResponse.json({ ok: true });
}
