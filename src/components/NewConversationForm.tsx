"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Friend = { username: string };

export default function NewConversationForm({ friends }: { friends: Friend[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"dm" | "group" | null>(null);
  const [dmTarget, setDmTarget] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDm() {
    if (!dmTarget) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: dmTarget }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el chat");
        return;
      }
      router.push(`/messages/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    if (!groupName.trim() || groupMembers.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, usernames: groupMembers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el grupo");
        return;
      }
      router.push(`/messages/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (friends.length === 0) {
    return <p className="text-muted text-sm">Agrega amigos primero para poder chatear con ellos.</p>;
  }

  if (!mode) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode("dm")} className="btn-accent rounded px-4 py-2 text-sm font-medium">
          Nuevo chat
        </button>
        <button onClick={() => setMode("group")} className="bg-surface hover-surface rounded px-4 py-2 text-sm text-base">
          Nuevo grupo
        </button>
      </div>
    );
  }

  return (
    <div className="border-base bg-surface flex max-w-md flex-col gap-3 rounded-lg border p-4">
      {mode === "dm" ? (
        <>
          <select
            value={dmTarget}
            onChange={(e) => setDmTarget(e.target.value)}
            className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
          >
            <option value="">Elige un amigo...</option>
            {friends.map((f) => (
              <option key={f.username} value={f.username}>
                {f.username}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={startDm}
              disabled={loading || !dmTarget}
              className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Abriendo..." : "Chatear"}
            </button>
            <button onClick={() => setMode(null)} className="bg-page hover-surface rounded px-4 py-2 text-sm text-base">
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nombre del grupo"
            maxLength={60}
            className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
          />
          <div className="flex flex-col gap-1">
            {friends.map((f) => (
              <label key={f.username} className="text-muted flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupMembers.includes(f.username)}
                  onChange={(e) =>
                    setGroupMembers((prev) =>
                      e.target.checked ? [...prev, f.username] : prev.filter((u) => u !== f.username)
                    )
                  }
                />
                {f.username}
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={createGroup}
              disabled={loading || !groupName.trim() || groupMembers.length === 0}
              className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear grupo"}
            </button>
            <button onClick={() => setMode(null)} className="bg-page hover-surface rounded px-4 py-2 text-sm text-base">
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
