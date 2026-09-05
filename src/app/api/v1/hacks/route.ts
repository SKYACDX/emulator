import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";
import { serializeHack } from "@/lib/apiSerializers";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get("game") ?? undefined;
  const platformSlug = searchParams.get("platform") ?? undefined;

  const hacks = await prisma.hack.findMany({
    where: {
      game: {
        slug: gameSlug,
        platform: platformSlug ? { slug: platformSlug } : undefined,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      game: { include: { platform: true } },
      author: { select: { username: true } },
      patches: { orderBy: { createdAt: "desc" } },
    },
  });

  const origin = new URL(request.url).origin;

  return corsJson({
    hacks: hacks.map((hack) => serializeHack(hack, origin)),
  });
}
