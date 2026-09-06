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
      <h1 className="text-2xl font-bold text-base">Comunidades</h1>

      {user && <NewCommunityForm />}

      {communities.length === 0 ? (
        <p className="text-muted">Todavía no hay comunidades. ¡Crea la primera!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {communities.map((c) => (
            <li key={c.id}>
              <Link
                href={`/communities/${c.slug}`}
                className="border-base bg-surface hover-border block rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-base">{c.name}</span>
                  <span className="text-muted text-xs">{c._count.members} miembro(s)</span>
                </div>
                {c.description && <p className="text-muted mt-1 text-sm">{c.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
