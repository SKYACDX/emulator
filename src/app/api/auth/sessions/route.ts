import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

/** "Cerrar todas las sesiones": kills every web session and every linked app
 * token for this account. The browser that asked keeps a fresh session. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  if (!(await checkRateLimit(`sessions-revoke:${user.id}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera unos minutos" },
      { status: 429 }
    );
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } }),
    prisma.apiToken.deleteMany({ where: { userId: user.id } }),
  ]);
  await createSessionCookie(user.id);

  return NextResponse.json({ ok: true });
}
