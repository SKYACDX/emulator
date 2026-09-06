import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight, parsePagination } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || undefined;
  const platformSlug = searchParams.get("platform") ?? undefined;
  const { limit, offset } = parsePagination(searchParams);

  // Public API, no session concept — only ever exposes public files whose
  // VirusTotal scan came back clean (or was skipped, e.g. no scanner
  // configured) — never anything still "pending" or that errored out.
  const where: Prisma.SharedFileWhereInput = {
    isPublic: true,
    virusScanStatus: { in: ["clean", "skipped"] },
    platform: platformSlug ? { slug: platformSlug } : undefined,
    OR: query
      ? [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { originalName: { contains: query, mode: "insensitive" } },
          { gameTitle: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [files, total] = await Promise.all([
    prisma.sharedFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: { uploader: { select: { username: true } }, platform: true },
    }),
    prisma.sharedFile.count({ where }),
  ]);

  const origin = new URL(request.url).origin;

  return corsJson({
    files: files.map((file) => ({
      id: file.id,
      title: file.title,
      description: file.description,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      platform: file.platform ? { slug: file.platform.slug, name: file.platform.name } : null,
      gameTitle: file.gameTitle,
      coverImageUrl: file.coverImageUrl,
      uploader: file.uploader.username,
      createdAt: file.createdAt.toISOString(),
      downloadUrl: `${origin}/api/files/${file.id}/download`,
    })),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + files.length < total,
    },
  });
}
