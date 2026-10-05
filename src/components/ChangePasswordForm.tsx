"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { generateSecurePassword } from "@/lib/passwordGenerator";
import { LINKED_DEVICES_CHANGED } from "./LinkedDevices";

export default function ChangePasswordForm({ totpEnabled }: { totpEnabled: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          ...(totpEnabled ? { code } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar la contraseña");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setCode("");
      setShowNew(false);
      setDone(true);
      window.dispatchEvent(new Event(LINKED_DEVICES_CHANGED));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-sm flex-col gap-3 rounded-lg border border-base bg-surface p-4"
    >
      <p className="text-sm text-muted">
        Al cambiarla se cierran tus sesiones en todos los demás navegadores y se
        desvinculan las apps del emulador. Esta sesión sigue abierta.
      </p>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Contraseña actual
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="rounded border border-base bg-page px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Contraseña nueva
        <div className="flex gap-2">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="flex-1 rounded border border-base bg-page px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="shrink-0 rounded bg-surface px-3 py-2 text-sm text-base hover-surface"
          >
            {showNew ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewPassword(generateSecurePassword());
            setShowNew(true);
          }}
          className="text-accent mt-1 self-start text-xs underline"
        >
          Generar contraseña segura
        </button>
      </label>
      {totpEnabled && (
        <label className="flex flex-col gap-1 text-sm text-muted">
          Código de 6 dígitos
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            maxLength={8}
            className="rounded border border-base bg-page px-3 py-2 text-base tracking-widest"
          />
        </label>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-accent">Contraseña actualizada.</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent self-start rounded px-4 py-2 font-medium disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
