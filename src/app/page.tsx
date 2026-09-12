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
    <div className="flex flex-col gap-10">
      <section className="scanlines border-base bg-surface relative overflow-hidden rounded-xl border p-8">
        <h1 className="font-pixel text-glow-accent text-accent text-xl leading-relaxed sm:text-2xl">
          RomHack Hub
        </h1>
        <p className="text-muted mt-4 max-w-2xl">
          Publica y descubre ROM hacks para consolas retro. Aquí solo se
          alojan <strong className="text-base">parches</strong> (IPS, BPS,
          UPS): descárgalos y aplícalos sobre tu propia copia legal del juego
          original desde nuestra{" "}
          <Link href="/patch" className="text-accent underline">
            herramienta de parcheo
          </Link>
          , que corre enteramente en tu navegador.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/platforms" className="btn-accent glow-accent rounded px-5 py-2.5 text-sm font-medium">
            Explorar plataformas
          </Link>
          <Link
            href="/hacks/new"
            className="border-base bg-page hover-border-accent rounded border px-5 py-2.5 text-sm font-medium text-base"
          >
            Publicar un hack
          </Link>
        </div>
      </section>

      <AdSlot />

      <section>
        <h2 className="font-pixel mb-5 text-[13px] tracking-wide text-base">
          Hacks recientes
        </h2>
        {hacks.length === 0 ? (
          <p className="text-muted">
            Todavía no hay hacks publicados. ¡Sé el primero!
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {hacks.map((hack) => (
              <li key={hack.id}>
                <Link href={`/hacks/${hack.slug}`} className="game-card flex h-full flex-col overflow-hidden">
                  <div className="border-base bg-page relative aspect-[3/4] w-full border-b">
                    {hack.game.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hack.game.coverImageUrl}
                        alt={hack.game.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted flex h-full w-full items-center justify-center text-xs">
                        Sin portada
                      </div>
                    )}
                    <span className="badge-accent absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium">
                      {hack.game.platform.name}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <h3 className="text-base line-clamp-1 text-sm font-medium">{hack.title}</h3>
                    <p className="text-muted line-clamp-1 text-xs">{hack.game.title}</p>
                    <p className="text-muted mt-auto text-xs">por {hack.author.username}</p>
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
