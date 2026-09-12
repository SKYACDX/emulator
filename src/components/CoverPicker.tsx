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
  const [query, setQuery] = useState(gameTitle);
  const [results, setResults] = useState<CoverResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) {
      setError("Escribe primero el nombre del juego");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
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
            className="h-16 w-auto rounded border border-base"
          />
        )}
        <div className="flex flex-1 flex-col gap-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Nombre del juego a buscar (en inglés suele dar más resultados)"
            className="border-base bg-surface rounded border px-3 py-1.5 text-sm text-base"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="shrink-0 rounded bg-surface px-3 py-1.5 text-sm text-base hover-surface disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-sm text-muted hover:text-base"
          >
            Quitar
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results && (
        <div className="flex flex-wrap gap-2 rounded border border-base bg-page p-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted">
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
                className="flex flex-col items-center gap-1 rounded border border-base p-1 hover-border-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.coverUrl!} alt={r.title} className="h-24 w-auto" />
                <span className="max-w-20 truncate text-xs text-muted">
                  {r.title}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-muted">
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
