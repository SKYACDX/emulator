import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hacks = await prisma.hack.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { game: { include: { platform: true } }, author: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-base bg-surface p-6">
        <h1 className="text-2xl font-bold text-base">RomHack Hub</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Publica y descubre ROM hacks para consolas retro. Aquí solo se
          alojan <strong>parches</strong> (IPS, BPS, UPS): descárgalos y
          aplícalos sobre tu propia copia legal del juego original desde
          nuestra{" "}
          <Link href="/patch" className="text-accent underline">
            herramienta de parcheo
          </Link>
          , que corre enteramente en tu navegador.
        </p>
      </section>

      <AdSlot />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-base">
          Hacks recientes
        </h2>
        {hacks.length === 0 ? (
          <p className="text-muted">
            Todavía no hay hacks publicados. ¡Sé el primero!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {hacks.map((hack) => (
              <li
                key={hack.id}
                className="rounded-lg border border-base bg-surface p-4 hover-border"
              >
                <Link href={`/hacks/${hack.slug}`} className="flex gap-3">
                  {hack.game.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hack.game.coverImageUrl}
                      alt={hack.game.title}
                      className="h-16 w-auto shrink-0 rounded border border-base"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-base">{hack.title}</h3>
                      <span className="rounded bg-surface px-2 py-0.5 text-xs text-muted">
                        {hack.game.platform.name}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {hack.game.title} · por {hack.author.username}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
