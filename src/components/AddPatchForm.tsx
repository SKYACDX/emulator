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
      className="flex max-w-md flex-col gap-3 rounded-lg border border-base bg-surface p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-muted">
        Versión
        <input
          name="version"
          required
          maxLength={30}
          className="rounded border border-base bg-page px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Notas de la versión (opcional)
        <textarea
          name="releaseNotes"
          rows={3}
          className="rounded border border-base bg-page px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Archivo de parche (.ips, .bps, .ups, .xdelta)
        <input
          type="file"
          name="patchFile"
          required
          accept=".ips,.bps,.ups,.xdelta"
          className="text-muted"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent self-start rounded px-4 py-2 font-medium disabled:opacity-60"
      >
        {loading ? "Subiendo..." : "Publicar versión"}
      </button>
    </form>
  );
}
