import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RP_ID, ORIGIN } from "@/lib/webauthn";

const schema = z.object({
  response: z.record(z.string(), z.unknown()),
  name: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const cookieStore = await cookies();
  const challenge = cookieStore.get("passkey_reg_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "La sesión de registro expiró, intenta de nuevo" }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: parsed.data.response as any,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  }).catch(() => null);

  cookieStore.delete("passkey_reg_challenge");

  if (!verification?.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "No se pudo verificar la passkey" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  const passkey = await prisma.passkey
    .create({
      data: {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? [],
        name: parsed.data.name,
        userId: user.id,
      },
    })
    .catch(() => null);

  if (!passkey) {
    return NextResponse.json({ error: "Esa passkey ya está registrada" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    passkey: { id: passkey.id, name: passkey.name, createdAt: passkey.createdAt.toISOString() },
  });
}
