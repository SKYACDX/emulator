"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupMembers({
  conversationId,
  members,
}: {
  conversationId: string;
  members: string[];
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo agregar");
        return;
      }
      setUsername("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    if (!confirm("¿Salir de este grupo?")) return;
    await fetch(`/api/conversations/${conversationId}/participants`, { method: "DELETE" });
    router.push("/messages");
  }

  return (
    <div className="border-base bg-surface flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <p className="text-muted">Miembros: {members.join(", ")}</p>
      <form onSubmit={addMember} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Agregar por usuario..."
          className="border-base bg-page flex-1 rounded border px-2 py-1 text-sm text-base"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-page hover-surface rounded px-3 py-1 text-sm text-base disabled:opacity-60"
        >
          Agregar
        </button>
      </form>
      {error && <p className="text-red-400">{error}</p>}
      <button onClick={leave} className="self-start text-xs text-red-400 hover:text-red-300">
        Salir del grupo
      </button>
    </div>
  );
}
