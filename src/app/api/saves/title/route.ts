import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { setSaveTitleSchema } from "@/lib/validation";

/**
 * Names a game the account already has cloud saves for, without uploading
 * anything: the apps use it to fill in saves uploaded before they sent
 * titles, reading the name from a ROM they have locally. Sets it on every
 * save of that gameKey for this user only.
 */
export async function PUT(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = setSaveTitleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { gameKey, title } = parsed.data;
  const { count } = await prisma.gameSave.updateMany({
    where: { userId: user.id, gameKey },
    data: { title },
  });
  if (count === 0) {
    return NextResponse.json(
      { error: "No tienes guardados en la nube de ese juego" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, updated: count });
}
