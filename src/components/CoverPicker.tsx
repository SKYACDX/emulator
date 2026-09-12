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
      {value && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Portada seleccionada"
            className="border-base h-16 w-auto rounded border"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted hover:text-base text-sm"
          >
            Quitar
          </button>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
        placeholder="Nombre del juego (en inglés suele dar más resultados)"
        className="border-base bg-surface w-full rounded border px-3 py-1.5 text-sm text-base"
      />
      <button
        type="button"
        onClick={handleSearch}
        disabled={loading}
        className="bg-surface hover-surface self-start rounded px-3 py-1.5 text-sm text-base disabled:opacity-60"
      >
        {loading ? "Buscando..." : "Buscar portada"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {results && (
        <div className="border-base bg-page max-h-72 overflow-y-auto rounded border p-2">
          {results.length === 0 ? (
            <p className="text-muted text-sm">Sin resultados con portada para ese nombre.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    onChange(r.coverUrl);
                    setResults(null);
                  }}
                  title={r.title}
                  className="border-base hover-border-accent flex flex-col gap-1 overflow-hidden rounded border text-left"
                >
                  <div className="bg-surface aspect-[3/4] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.coverUrl!} alt={r.title} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-muted line-clamp-2 px-1 pb-1 text-xs">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-muted text-xs">
        Portadas cortesía de{" "}
        <a href="https://thegamesdb.net" target="_blank" rel="noreferrer" className="underline">
          TheGamesDB
        </a>
        .
      </p>
    </div>
  );
}
