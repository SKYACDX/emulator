import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plataformas",
  description:
    "Explora ROM hacks por consola: NES, SNES, Game Boy, GBA, Nintendo DS, 3DS, N64 y Switch.",
  alternates: { canonical: "/platforms" },
};

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { games: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-base">Plataformas</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {platforms.map((platform) => (
          <li key={platform.id}>
            <Link
              href={`/platforms/${platform.slug}`}
              className="block rounded-lg border border-base bg-surface p-4 hover-border"
            >
              <span className="font-medium text-base">{platform.name}</span>
              <p className="text-sm text-muted">
                {platform._count.games} juego(s)
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
