import type { Game, Hack, Patch, Platform } from "@/generated/prisma/client";
import { formatLabel } from "@/lib/patchFormats";

type HackWithRelations = Hack & {
  game: Game & { platform: Platform };
  author: { username: string };
  patches: Patch[];
};

export function serializeHack(hack: HackWithRelations, origin: string) {
  return {
    id: hack.id,
    slug: hack.slug,
    title: hack.title,
    description: hack.description,
    createdAt: hack.createdAt.toISOString(),
    author: hack.author.username,
    game: {
      slug: hack.game.slug,
      title: hack.game.title,
      coverImageUrl: hack.game.coverImageUrl,
      platform: { slug: hack.game.platform.slug, name: hack.game.platform.name },
    },
    patches: hack.patches.map((patch) => ({
      id: patch.id,
      version: patch.version,
      format: patch.format,
      formatLabel: formatLabel(patch.format),
      originalName: patch.originalName,
      fileSize: patch.fileSize,
      sha256: patch.sha256,
      releaseNotes: patch.releaseNotes,
      createdAt: patch.createdAt.toISOString(),
      downloadUrl: `${origin}/api/patches/${patch.id}/download`,
    })),
  };
}
