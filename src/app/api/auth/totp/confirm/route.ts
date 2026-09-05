import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptSecret, verifyTotpToken } from "@/lib/totp";

const schema = z.object({ code: z.string().trim().min(6).max(8) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.totpPendingSecret) {
    return NextResponse.json(
      { error: "No hay una configuración de 2FA pendiente. Empieza de nuevo." },
      { status: 400 }
    );
  }

  const secret = decryptSecret(dbUser.totpPendingSecret);
  if (!(await verifyTotpToken(parsed.data.code, secret))) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpEnabled: true,
      totpSecret: dbUser.totpPendingSecret,
      totpPendingSecret: null,
    },
  });

  return NextResponse.json({ ok: true });
}
