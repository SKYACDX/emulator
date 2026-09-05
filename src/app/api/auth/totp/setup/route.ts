import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateTotpSecret, encryptSecret, buildTotpQrCodeDataUrl } from "@/lib/totp";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (user.totpEnabled) {
    return NextResponse.json(
      { error: "La verificación en dos pasos ya está activada" },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  const { otpauthUrl, qrCodeDataUrl } = await buildTotpQrCodeDataUrl(user.email, secret);

  await prisma.user.update({
    where: { id: user.id },
    data: { totpPendingSecret: encryptSecret(secret) },
  });

  return NextResponse.json({ secret, otpauthUrl, qrCodeDataUrl });
}
