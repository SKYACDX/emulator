"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import CoverPicker from "./CoverPicker";

type Platform = { id: string; slug: string; name: string };

export default function NewHackForm({ platforms }: { platforms: Platform[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [platformSlug, setPlatformSlug] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (coverImageUrl) formData.set("coverImageUrl", coverImageUrl);

    try {
      const res = await fetch("/api/hacks", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }
      router.push(`/hacks/${data.slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Plataforma
        <select
          name="platformSlug"
          required
          value={platformSlug}
          onChange={(e) => setPlatformSlug(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        >
          <option value="" disabled>
            Selecciona una plataforma
          </option>
          {platforms.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Juego base
        <input
          name="gameTitle"
          required
          maxLength={120}
          placeholder="Ej. Super Mario World"
          value={gameTitle}
          onChange={(e) => setGameTitle(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-neutral-300">
        <span>Portada (opcional)</span>
        <CoverPicker
          gameTitle={gameTitle}
          platformSlug={platformSlug || undefined}
          value={coverImageUrl}
          onChange={setCoverImageUrl}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Título del hack
        <input
          name="hackTitle"
          required
          maxLength={120}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Descripción
        <textarea
          name="description"
          required
          rows={5}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Versión inicial
        <input
          name="version"
          required
          maxLength={30}
          placeholder="1.0"
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Notas de la versión (opcional)
        <textarea
          name="releaseNotes"
          rows={3}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Archivo de parche (.ips, .bps, .ups, .xdelta)
        <input
          type="file"
          name="patchFile"
          required
          accept=".ips,.bps,.ups,.xdelta"
          className="text-neutral-300"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "Publicando..." : "Publicar hack"}
      </button>
    </form>
  );
}
