import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie } from "@/lib/auth";
import { RP_ID, ORIGIN } from "@/lib/webauthn";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { recordLoginAttempt } from "@/lib/loginAttempts";

const schema = z.object({
  response: z.object({ id: z.string() }).and(z.record(z.string(), z.unknown())),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!(await checkRateLimit(`passkey-login:${ip}`, 15, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados intentos, espera unos minutos" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const challenge = cookieStore.get("passkey_login_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "La sesión de acceso expiró, intenta de nuevo" }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: parsed.data.response.id },
    include: { user: true },
  });

  if (!passkey) {
    cookieStore.delete("passkey_login_challenge");
    await recordLoginAttempt({ email: "(passkey desconocida)", success: false, method: "passkey", ip, userAgent });
    return NextResponse.json({ error: "Passkey no reconocida" }, { status: 400 });
  }

  const verification = await verifyAuthenticationResponse({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: parsed.data.response as any,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as ("ble" | "hybrid" | "internal" | "nfc" | "usb")[],
    },
  }).catch(() => null);

  cookieStore.delete("passkey_login_challenge");

  if (!verification?.verified) {
    await recordLoginAttempt({
      email: passkey.user.email,
      success: false,
      method: "passkey",
      ip,
      userAgent,
      userId: passkey.userId,
    });
    return NextResponse.json({ error: "No se pudo verificar la passkey" }, { status: 400 });
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
  });

  await createSessionCookie(passkey.userId);
  await recordLoginAttempt({
    email: passkey.user.email,
    success: true,
    method: "passkey",
    ip,
    userAgent,
    userId: passkey.userId,
  });

  return NextResponse.json({ ok: true });
}
