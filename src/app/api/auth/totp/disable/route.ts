import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { decryptSecret, verifyTotpToken } from "@/lib/totp";

const schema = z.object({
  password: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.totpEnabled || !dbUser.totpSecret) {
    return NextResponse.json(
      { error: "La verificación en dos pasos no está activada" },
      { status: 400 }
    );
  }

  if (!(await verifyPassword(parsed.data.password, dbUser.passwordHash))) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = decryptSecret(dbUser.totpSecret);
  if (!(await verifyTotpToken(parsed.data.code, secret))) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null, totpPendingSecret: null },
  });

  return NextResponse.json({ ok: true });
}
