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
      <h1 className="text-2xl font-bold text-white">{platform.name}</h1>
      {platform.games.length === 0 ? (
        <p className="text-neutral-500">
          Todavía no hay juegos con hacks publicados para esta plataforma.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {platform.games.map((game) => (
            <div key={game.id}>
              <div className="mb-2 flex items-center gap-3">
                {game.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={game.coverImageUrl}
                    alt={game.title}
                    className="h-10 w-auto rounded border border-neutral-800"
                  />
                )}
                <h2 className="text-lg font-semibold text-white">{game.title}</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {game.hacks.map((hack) => (
                  <li key={hack.id}>
                    <Link
                      href={`/hacks/${hack.slug}`}
                      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-700"
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
