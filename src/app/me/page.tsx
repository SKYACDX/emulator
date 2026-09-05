import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MyHacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hacks = await prisma.hack.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      game: { include: { platform: true } },
      patches: { select: { id: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mis hacks</h1>
        <Link
          href="/hacks/new"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Publicar nuevo hack
        </Link>
      </div>

      {hacks.length === 0 ? (
        <p className="text-neutral-500">
          Todavía no has publicado ningún hack.{" "}
          <Link href="/hacks/new" className="text-emerald-400 underline">
            Publica el primero
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {hacks.map((hack) => (
            <li key={hack.id}>
              <Link
                href={`/hacks/${hack.slug}`}
                className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium text-white">{hack.title}</h2>
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                    {hack.game.platform.name}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-400">
                  {hack.game.title} · {hack.patches.length} versión(es)
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
