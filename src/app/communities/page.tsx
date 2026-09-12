import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import NewCommunityForm from "@/components/NewCommunityForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comunidades",
  description: "Grupos de la comunidad de RomHack Hub.",
  alternates: { canonical: "/communities" },
};

export default async function CommunitiesPage() {
  const user = await getCurrentUser();
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base text-lg">Comunidades</h1>

      {user && <NewCommunityForm />}

      {communities.length === 0 ? (
        <p className="text-muted">Todavía no hay comunidades. ¡Crea la primera!</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {communities.map((c) => (
            <li key={c.id}>
              <Link href={`/communities/${c.slug}`} className="game-card block overflow-hidden">
                <div className="bg-accent h-1.5 w-full" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">{c.name}</span>
                    <span className="text-muted text-xs">{c._count.members} miembro(s)</span>
                  </div>
                  {c.description && <p className="text-muted mt-1 text-sm">{c.description}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
