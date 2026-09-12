import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getPlatform = cache(async (slug: string) => {
  return prisma.platform.findUnique({
    where: { slug },
    include: {
      games: {
        orderBy: { title: "asc" },
        include: { hacks: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const platform = await getPlatform(slug);
  if (!platform) return {};

  const hackCount = platform.games.reduce((sum, g) => sum + g.hacks.length, 0);
  const title = `Hacks para ${platform.name}`;
  const description = `${hackCount} hack(s) de ROM disponibles para ${platform.name} en RomHack Hub: parches IPS/BPS/UPS listos para descargar.`;

  return {
    title,
    description,
    alternates: { canonical: `/platforms/${platform.slug}` },
    openGraph: { title, description },
  };
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = await getPlatform(slug);

  if (!platform) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base text-lg">{platform.name}</h1>
      {platform.games.length === 0 ? (
        <p className="text-muted">
          Todavía no hay juegos con hacks publicados para esta plataforma.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {platform.games.map((game) => (
            <div key={game.id}>
              <div className="mb-3 flex items-center gap-3">
                {game.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={game.coverImageUrl}
                    alt={game.title}
                    className="border-base h-12 w-auto rounded border"
                  />
                )}
                <h2 className="text-base text-lg font-semibold">{game.title}</h2>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {game.hacks.map((hack) => (
                  <li key={hack.id}>
                    <Link
                      href={`/hacks/${hack.slug}`}
                      className="game-card block p-3 text-sm font-medium text-base"
                    >
                      {hack.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
