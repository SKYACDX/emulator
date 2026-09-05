import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformSlug = searchParams.get("platform") ?? undefined;
  const query = searchParams.get("q")?.trim() || undefined;

  const games = await prisma.game.findMany({
    where: {
      platform: platformSlug ? { slug: platformSlug } : undefined,
      title: query ? { contains: query, mode: "insensitive" } : undefined,
    },
    orderBy: { title: "asc" },
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      platform: { select: { slug: true, name: true } },
      _count: { select: { hacks: true } },
    },
  });

  return corsJson({
    games: games.map((g) => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      platform: g.platform,
      hackCount: g._count.hacks,
    })),
  });
}
