"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          body: formData.get("body"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="border-base bg-surface rounded-lg border p-4 text-base">
        Mensaje enviado. Gracias — lo revisamos pronto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Nombre
        <input
          name="name"
          required
          maxLength={120}
          className="border-base bg-surface rounded border px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Correo (para responderte)
        <input
          name="email"
          type="email"
          required
          maxLength={255}
          className="border-base bg-surface rounded border px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Asunto
        <input
          name="subject"
          required
          maxLength={200}
          className="border-base bg-surface rounded border px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Mensaje
        <textarea
          name="body"
          required
          rows={5}
          maxLength={5000}
          className="border-base bg-surface rounded border px-3 py-2 text-base"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
