import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight, parsePagination } from "@/lib/cors";
import { serializeHack } from "@/lib/apiSerializers";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get("game") ?? undefined;
  const platformSlug = searchParams.get("platform") ?? undefined;
  const query = searchParams.get("q")?.trim() || undefined;
  const { limit, offset } = parsePagination(searchParams);

  const where: Prisma.HackWhereInput = {
    title: query ? { contains: query, mode: "insensitive" } : undefined,
    game: {
      slug: gameSlug,
      platform: platformSlug ? { slug: platformSlug } : undefined,
    },
  };

  const [hacks, total] = await Promise.all([
    prisma.hack.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        game: { include: { platform: true } },
        author: { select: { username: true } },
        patches: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.hack.count({ where }),
  ]);

  const origin = new URL(request.url).origin;

  return corsJson({
    hacks: hacks.map((hack) => serializeHack(hack, origin)),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + hacks.length < total,
    },
  });
}
