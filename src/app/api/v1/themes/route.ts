import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight, parsePagination } from "@/lib/cors";
import { serializeEmulatorTheme } from "@/lib/emulatorThemes";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const system = searchParams.get("system") ?? undefined;
  const query = searchParams.get("q")?.trim() || undefined;
  const sort = searchParams.get("sort") === "newest" ? "newest" : "downloads";
  const { limit, offset } = parsePagination(searchParams);

  const where: Prisma.EmulatorThemeWhereInput = {
    isPublic: true,
    system,
    OR: query
      ? [
          { name: { contains: query, mode: "insensitive" } },
          { author: { username: { contains: query, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [themes, total] = await Promise.all([
    prisma.emulatorTheme.findMany({
      where,
      orderBy: sort === "newest" ? { createdAt: "desc" } : { downloads: "desc" },
      take: limit,
      skip: offset,
      include: { author: { select: { username: true } } },
    }),
    prisma.emulatorTheme.count({ where }),
  ]);

  return corsJson({
    themes: themes.map(serializeEmulatorTheme),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + themes.length < total,
    },
  });
}
