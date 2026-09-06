"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewCommunityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear");
        return;
      }
      router.push(`/communities/${data.slug}`);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-accent self-start rounded px-4 py-2 text-sm font-medium">
        Crear comunidad
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-base bg-surface flex max-w-md flex-col gap-3 rounded-lg border p-4">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Nombre
        <input name="name" required maxLength={60} className="border-base bg-page rounded border px-3 py-2 text-base" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Descripción (opcional)
        <textarea name="description" rows={3} className="border-base bg-page rounded border px-3 py-2 text-base" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60">
          {loading ? "Creando..." : "Crear"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="bg-page hover-surface rounded px-4 py-2 text-sm text-base">
          Cancelar
        </button>
      </div>
    </form>
  );
}
