"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommunityActions({
  slug,
  isLoggedIn,
  isMember,
  isOwner,
}: {
  slug: string;
  isLoggedIn: boolean;
  isMember: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE", path: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(path, { method });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }
      if (path.endsWith(`/communities/${slug}`)) {
        router.push("/communities");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex items-center gap-2">
      {!isMember && (
        <button
          onClick={() => call("POST", `/api/communities/${slug}/join`)}
          disabled={loading}
          className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Unirme
        </button>
      )}
      {isMember && !isOwner && (
        <button
          onClick={() => call("DELETE", `/api/communities/${slug}/join`)}
          disabled={loading}
          className="bg-surface hover-surface rounded px-4 py-2 text-sm text-base disabled:opacity-60"
        >
          Salir
        </button>
      )}
      {isOwner && (
        <button
          onClick={() => {
            if (confirm("¿Eliminar esta comunidad para siempre?")) {
              call("DELETE", `/api/communities/${slug}`);
            }
          }}
          disabled={loading}
          className="rounded bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-60"
        >
          Eliminar comunidad
        </button>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
