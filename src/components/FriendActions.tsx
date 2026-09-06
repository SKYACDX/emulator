"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Button shown on a public profile page. `status` reflects the caller's
// relationship to that profile's owner, computed server-side.
export default function FriendActions({
  username,
  status,
  friendshipId,
}: {
  username: string;
  status: "none" | "friends" | "incoming" | "outgoing";
  friendshipId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function call(method: "POST" | "DELETE", path: string, body?: object) {
    setLoading(true);
    try {
      await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "friends") {
    return (
      <button
        onClick={() => friendshipId && call("DELETE", `/api/friends/${friendshipId}`)}
        disabled={loading}
        className="bg-surface hover-surface rounded px-4 py-2 text-sm text-base disabled:opacity-60"
      >
        Amigos ✓ (quitar)
      </button>
    );
  }

  if (status === "incoming") {
    return (
      <button
        onClick={() => friendshipId && call("POST", `/api/friends/${friendshipId}`)}
        disabled={loading}
        className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        Aceptar solicitud
      </button>
    );
  }

  if (status === "outgoing") {
    return (
      <button
        onClick={() => friendshipId && call("DELETE", `/api/friends/${friendshipId}`)}
        disabled={loading}
        className="bg-surface hover-surface rounded px-4 py-2 text-sm text-base disabled:opacity-60"
      >
        Solicitud enviada (cancelar)
      </button>
    );
  }

  return (
    <button
      onClick={() => call("POST", "/api/friends", { username })}
      disabled={loading}
      className="btn-accent rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
    >
      Agregar amigo
    </button>
  );
}
