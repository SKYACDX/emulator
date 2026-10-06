import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ showSavedGameTitles: z.boolean() });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { showSavedGameTitles: parsed.data.showSavedGameTitles },
  });

  return NextResponse.json({ ok: true });
}
