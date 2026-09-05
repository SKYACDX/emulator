"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AddPatchForm({ hackId }: { hackId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("hackId", hackId);

    try {
      const res = await fetch("/api/patches", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-md flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Versión
        <input
          name="version"
          required
          maxLength={30}
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Notas de la versión (opcional)
        <textarea
          name="releaseNotes"
          rows={3}
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
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
        {loading ? "Subiendo..." : "Publicar versión"}
      </button>
    </form>
  );
}
