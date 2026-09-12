"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

type Passkey = {
  id: string;
  name: string | null;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/auth/passkey");
    const data = await res.json();
    if (res.ok) setPasskeys(data.passkeys);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    setError(null);
    setLoading(true);
    try {
      const optionsRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      const optionsJSON = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(optionsJSON.error ?? "No se pudo iniciar el registro");
        return;
      }
      const response = await startRegistration({ optionsJSON });
      const name = prompt("Ponle un nombre a esta passkey (opcional)") ?? undefined;
      const verifyRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, name }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error ?? "No se pudo registrar la passkey");
        return;
      }
      await load();
    } catch {
      // cancelled the browser prompt
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta passkey?")) return;
    await fetch(`/api/auth/passkey/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-sm">
        Inicia sesión con huella, Face ID, o una llave física, sin escribir tu
        contraseña.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleAdd}
        disabled={loading}
        className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Agregar passkey"}
      </button>

      {passkeys && passkeys.length > 0 && (
        <ul className="flex flex-col gap-2">
          {passkeys.map((p) => (
            <li
              key={p.id}
              className="border-base bg-surface flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-base text-sm font-medium">{p.name || "Passkey sin nombre"}</p>
                <p className="text-muted text-xs">
                  Creada {new Date(p.createdAt).toLocaleDateString("es")}
                  {p.lastUsedAt && ` · último uso ${new Date(p.lastUsedAt).toLocaleDateString("es")}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
