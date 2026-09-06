"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ username: string }[]>([]);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  async function sendRequest(username: string) {
    setError(null);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setSentTo(username);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre de usuario..."
        className="border-base bg-page w-full max-w-sm rounded border px-3 py-2 text-sm text-base"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {results.length > 0 && (
        <ul className="flex max-w-sm flex-col gap-2">
          {results.map((u) => (
            <li
              key={u.username}
              className="border-base bg-surface flex items-center justify-between rounded-lg border p-2"
            >
              <Link href={`/u/${u.username}`} className="text-base hover-text-accent text-sm">
                {u.username}
              </Link>
              <button
                onClick={() => sendRequest(u.username)}
                disabled={sentTo === u.username}
                className="btn-accent rounded px-3 py-1 text-xs font-medium disabled:opacity-60"
              >
                {sentTo === u.username ? "Enviada" : "Agregar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
