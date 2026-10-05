"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LINKED_DEVICES_CHANGED } from "./LinkedDevices";

export default function RevokeSessions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleRevoke() {
    if (
      !confirm(
        "¿Cerrar todas las sesiones? Se cerrarán en todos los demás navegadores y se desvincularán las apps del emulador."
      )
    )
      return;
    setError(null);
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sessions", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cerrar las sesiones");
        return;
      }
      setDone(true);
      window.dispatchEvent(new Event(LINKED_DEVICES_CHANGED));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-base bg-surface p-4">
      <p className="text-sm text-muted">
        Cierra tu sesión en todos los navegadores y desvincula todas las apps
        del emulador. Esta sesión se mantiene abierta. Úsalo si perdiste un
        dispositivo o sospechas que alguien más entró a tu cuenta.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-accent">Sesiones cerradas.</p>}
      <button
        onClick={handleRevoke}
        disabled={loading}
        className="self-start rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-60"
      >
        {loading ? "Cerrando..." : "Cerrar todas las sesiones"}
      </button>
    </div>
  );
}
