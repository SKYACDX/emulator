"use client";

import { useEffect, useState } from "react";

type Token = {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

export default function LinkedDevices() {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/tokens")
      .then((res) => res.json())
      .then((data) => setTokens(data.tokens ?? []))
      .catch(() => setError("No se pudieron cargar los dispositivos"));
  }, []);

  async function handleRevoke(id: string) {
    if (!confirm("¿Desvincular este dispositivo? Tendrá que iniciar sesión de nuevo ahí.")) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/me/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo desvincular");
        return;
      }
      setTokens((prev) => prev?.filter((t) => t.id !== id) ?? null);
    } finally {
      setRevoking(null);
    }
  }

  if (tokens === null) {
    return <p className="text-muted text-sm">Cargando...</p>;
  }

  if (tokens.length === 0) {
    return (
      <p className="text-muted text-sm">
        No has vinculado ningún dispositivo (app del emulador) a tu cuenta todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="flex flex-col gap-2">
        {tokens.map((token) => (
          <li
            key={token.id}
            className="border-base bg-surface flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="text-base text-sm">{token.label ?? "Dispositivo sin nombre"}</p>
              <p className="text-muted text-xs">
                Vinculado el {formatDate(token.createdAt)}
                {token.lastUsedAt && ` · usado por última vez el ${formatDate(token.lastUsedAt)}`}
              </p>
            </div>
            <button
              onClick={() => handleRevoke(token.id)}
              disabled={revoking === token.id}
              className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
            >
              {revoking === token.id ? "..." : "Desvincular"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
