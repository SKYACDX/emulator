"use client";

import { useState } from "react";

type CoverResult = {
  id: number;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
};

export default function CoverPicker({
  gameTitle,
  platformSlug,
  value,
  onChange,
}: {
  gameTitle: string;
  platformSlug?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [results, setResults] = useState<CoverResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!gameTitle.trim()) {
      setError("Escribe primero el nombre del juego");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: gameTitle });
      if (platformSlug) params.set("platform", platformSlug);
      const res = await fetch(`/api/games/search-cover?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo buscar la portada");
        return;
      }
      setResults(data.results.filter((r: CoverResult) => r.coverUrl));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Portada seleccionada"
            className="h-16 w-auto rounded border border-neutral-700"
          />
        )}
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {loading ? "Buscando..." : value ? "Cambiar portada" : "Buscar portada"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Quitar
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results && (
        <div className="flex flex-wrap gap-2 rounded border border-neutral-800 bg-neutral-950 p-2">
          {results.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Sin resultados con portada para ese nombre.
            </p>
          ) : (
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  onChange(r.coverUrl);
                  setResults(null);
                }}
                title={r.title}
                className="flex flex-col items-center gap-1 rounded border border-neutral-700 p-1 hover:border-emerald-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.coverUrl!} alt={r.title} className="h-24 w-auto" />
                <span className="max-w-20 truncate text-xs text-neutral-400">
                  {r.title}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-neutral-600">
        Portadas cortesía de{" "}
        <a
          href="https://thegamesdb.net"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          TheGamesDB
        </a>
        .
      </p>
    </div>
  );
}
