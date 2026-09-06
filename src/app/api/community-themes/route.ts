import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCommunityThemeSchema } from "@/lib/validation";

export async function GET() {
  const themes = await prisma.communityTheme.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { creator: { select: { username: true } } },
  });

  return NextResponse.json({
    themes: themes.map((t) => ({
      id: t.id,
      name: t.name,
      bg: t.bg,
      surface: t.surface,
      accent: t.accent,
      text: t.text,
      creator: t.creator.username,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommunityThemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const theme = await prisma.communityTheme.create({
    data: { ...parsed.data, creatorId: user.id },
  });

  return NextResponse.json({ ok: true, id: theme.id });
}
