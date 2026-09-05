import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { games: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Plataformas</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {platforms.map((platform) => (
          <li key={platform.id}>
            <Link
              href={`/platforms/${platform.slug}`}
              className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700"
            >
              <span className="font-medium text-white">{platform.name}</span>
              <p className="text-sm text-neutral-500">
                {platform._count.games} juego(s)
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
