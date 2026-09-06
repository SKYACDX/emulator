"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Hack = {
  id: string;
  title: string;
  slug: string;
  author: string;
  platform: string;
  game: string;
  patchCount: number;
  createdAt: string;
};

export default function AdminHacksTable({ hacks }: { hacks: Hack[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(hack: Hack) {
    if (
      !confirm(
        `¿Eliminar "${hack.title}" (${hack.patchCount} versión(es) de parche)? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    setPendingId(hack.id);
    try {
      const res = await fetch(`/api/admin/hacks/${hack.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (hacks.length === 0) {
    return <p className="text-muted">No hay hacks publicados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-base">
      {error && <p className="p-3 text-sm text-red-400">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-3 py-2">Título</th>
            <th className="px-3 py-2">Juego / Plataforma</th>
            <th className="px-3 py-2">Autor</th>
            <th className="px-3 py-2">Parches</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {hacks.map((hack) => (
            <tr key={hack.id} className="border-t border-base">
              <td className="px-3 py-2">
                <Link href={`/hacks/${hack.slug}`} className="text-accent hover:underline">
                  {hack.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-muted">
                {hack.game} · {hack.platform}
              </td>
              <td className="px-3 py-2 text-muted">{hack.author}</td>
              <td className="px-3 py-2 text-muted">{hack.patchCount}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => handleDelete(hack)}
                  disabled={pendingId === hack.id}
                  className="rounded bg-red-700 px-3 py-1 text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {pendingId === hack.id ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
