"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Feedback = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  canDelete: boolean;
};

export default function AppFeedback({
  isLoggedIn,
  feedback,
}: {
  isLoggedIn: boolean;
  feedback: Feedback[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/app/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar");
        return;
      }
      setBody("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    await fetch(`/api/app/feedback/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="¿Qué te parece la app? ¿Algo que falta o que no funciona bien?"
            rows={3}
            maxLength={2000}
            className="border-base bg-surface rounded border px-3 py-2 text-sm text-base"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar comentario"}
          </button>
        </form>
      ) : (
        <p className="text-muted text-sm">
          Inicia sesión para dejar tu comentario sobre la app.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {feedback.map((f) => (
          <li key={f.id} className="border-base bg-surface rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-sm font-medium">{f.author}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs">
                  {new Date(f.createdAt).toLocaleDateString("es")}
                </span>
                {f.canDelete && (
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            <p className="text-base mt-1 whitespace-pre-wrap text-sm">{f.body}</p>
          </li>
        ))}
        {feedback.length === 0 && (
          <p className="text-muted text-sm">Todavía no hay comentarios.</p>
        )}
      </ul>
    </div>
  );
}
