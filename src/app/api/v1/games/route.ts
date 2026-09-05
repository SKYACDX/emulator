import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight, parsePagination } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformSlug = searchParams.get("platform") ?? undefined;
  const query = searchParams.get("q")?.trim() || undefined;
  const { limit, offset } = parsePagination(searchParams);

  const where = {
    platform: platformSlug ? { slug: platformSlug } : undefined,
    title: query ? { contains: query, mode: "insensitive" as const } : undefined,
  };

  const [games, total] = await Promise.all([
    prisma.game.findMany({
      where,
      orderBy: { title: "asc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        slug: true,
        title: true,
        platform: { select: { slug: true, name: true } },
        _count: { select: { hacks: true } },
      },
    }),
    prisma.game.count({ where }),
  ]);

  return corsJson({
    games: games.map((g) => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      platform: g.platform,
      hackCount: g._count.hacks,
    })),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + games.length < total,
    },
  });
}
