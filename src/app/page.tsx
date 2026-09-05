import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const hacks = await prisma.hack.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { game: { include: { platform: true } }, author: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-2xl font-bold text-white">RomHack Hub</h1>
        <p className="mt-2 max-w-2xl text-neutral-400">
          Publica y descubre ROM hacks para consolas retro. Aquí solo se
          alojan <strong>parches</strong> (IPS, BPS, UPS): descárgalos y
          aplícalos sobre tu propia copia legal del juego original desde
          nuestra{" "}
          <Link href="/patch" className="text-emerald-400 underline">
            herramienta de parcheo
          </Link>
          , que corre enteramente en tu navegador.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Hacks recientes
        </h2>
        {hacks.length === 0 ? (
          <p className="text-neutral-500">
            Todavía no hay hacks publicados. ¡Sé el primero!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {hacks.map((hack) => (
              <li
                key={hack.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700"
              >
                <Link href={`/hacks/${hack.slug}`} className="block">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{hack.title}</h3>
                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                      {hack.game.platform.name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">
                    {hack.game.title} · por {hack.author.username}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
