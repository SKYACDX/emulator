import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, verifyTotpPendingToken } from "@/lib/auth";
import { decryptSecret, verifyTotpToken } from "@/lib/totp";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export async function POST(request: Request) {
  if (!checkRateLimit(`totp-login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
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
    return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
  }

  await createSessionCookie(user.id);

  return NextResponse.json({ ok: true });
}
