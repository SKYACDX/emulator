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
      <h1 className="font-pixel text-base text-lg">Plataformas</h1>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {platforms.map((platform) => (
          <li key={platform.id}>
            <Link
              href={`/platforms/${platform.slug}`}
              className="game-card block overflow-hidden"
            >
              <div className="bg-accent h-1.5 w-full" />
              <div className="p-4">
                <span className="text-base font-medium">{platform.name}</span>
                <p className="text-muted text-sm">
                  {platform._count.games} juego(s)
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
