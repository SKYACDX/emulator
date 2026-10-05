import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { decryptSecret, verifyTotpToken } from "@/lib/totp";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { recordLoginAttempt } from "@/lib/loginAttempts";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  // Same budget as login (10 per 15 min), per account and per IP — someone
  // holding a stolen session must not be able to brute-force the password here.
  if (
    !(await checkRateLimit(`password-change:${user.id}`, 10, 15 * 60 * 1000)) ||
    !(await checkRateLimit(`password-change-ip:${ip}`, 10, 15 * 60 * 1000))
  ) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { currentPassword, newPassword, code } = parsed.data;

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const failure = { email: dbUser.email, success: false, ip, userAgent, userId: dbUser.id } as const;

  if (!(await verifyPassword(currentPassword, dbUser.passwordHash))) {
    await recordLoginAttempt({ ...failure, method: "password" });
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });
  }

  if (dbUser.totpEnabled && dbUser.totpSecret) {
    if (!code) {
      return NextResponse.json(
        { error: "Ingresa el código de tu app de autenticación" },
        { status: 400 }
      );
    }
    if (!(await verifyTotpToken(code, decryptSecret(dbUser.totpSecret)))) {
      await recordLoginAttempt({ ...failure, method: "totp" });
      return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
    }
  }

  if (await verifyPassword(newPassword, dbUser.passwordHash)) {
    return NextResponse.json(
      { error: "La nueva contraseña debe ser distinta de la actual" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);

  // One transaction: the new hash, the session cut-off and the linked-device
  // wipe either all happen or none do.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: dbUser.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.apiToken.deleteMany({ where: { userId: dbUser.id } }),
  ]);

  // Every cookie issued before this point is now dead, including this
  // browser's — re-issue it so the person who just changed the password
  // stays logged in here.
  await createSessionCookie(dbUser.id);

  return NextResponse.json({ ok: true });
}
