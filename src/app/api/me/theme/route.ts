import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidThemeId } from "@/lib/themes";

const schema = z.object({ theme: z.string().min(1) });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidThemeId(parsed.data.theme)) {
    return NextResponse.json({ error: "Tema inválido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { theme: parsed.data.theme },
  });

  return NextResponse.json({ ok: true });
}
