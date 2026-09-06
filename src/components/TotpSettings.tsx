"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type SetupData = { secret: string; qrCodeDataUrl: string };

export default function TotpSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar la configuración");
        return;
      }
      setSetupData({ secret: data.secret, qrCodeDataUrl: data.qrCodeDataUrl });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código incorrecto");
        return;
      }
      setEnabled(true);
      setSetupData(null);
      setCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo desactivar");
        return;
      }
      setEnabled(false);
      setDisabling(false);
      setCode("");
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (setupData) {
    return (
      <div className="flex max-w-sm flex-col gap-4 rounded-lg border border-base bg-surface p-4">
        <p className="text-sm text-muted">
          Escanea este código con Google Authenticator, Authy, o cualquier app
          compatible con TOTP.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={setupData.qrCodeDataUrl}
          alt="Código QR para configurar 2FA"
          className="h-48 w-48 self-center rounded bg-white p-2"
        />
        <p className="text-xs text-muted">
          ¿No puedes escanear? Ingresa esta clave manualmente:
          <br />
          <code className="text-muted">{setupData.secret}</code>
        </p>
        <form onSubmit={handleConfirm} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Código de 6 dígitos
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              inputMode="numeric"
              maxLength={8}
              className="rounded border border-base bg-page px-3 py-2 text-base tracking-widest"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-accent rounded px-4 py-2 font-medium disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Confirmar y activar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupData(null);
                setError(null);
              }}
              className="rounded bg-surface px-4 py-2 text-base hover-surface"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (disabling) {
    return (
      <form
        onSubmit={handleDisable}
        className="flex max-w-sm flex-col gap-3 rounded-lg border border-base bg-surface p-4"
      >
        <p className="text-sm text-muted">
          Para desactivar la verificación en dos pasos, confirma tu contraseña
          y un código actual de tu app de autenticación.
        </p>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded border border-base bg-page px-3 py-2 text-base"
          />
        </label>
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
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Desactivando..." : "Desactivar 2FA"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDisabling(false);
              setError(null);
            }}
            className="rounded bg-surface px-4 py-2 text-base hover-surface"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-base bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          Verificación en dos pasos (2FA)
        </span>
        <span
          className={
            enabled
              ? "rounded badge-accent px-2 py-0.5 text-xs"
              : "rounded bg-surface px-2 py-0.5 text-xs text-muted"
          }
        >
          {enabled ? "Activada" : "Desactivada"}
        </span>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {enabled ? (
        <button
          onClick={() => setDisabling(true)}
          className="self-start rounded bg-surface px-4 py-2 text-base hover-surface"
        >
          Desactivar 2FA
        </button>
      ) : (
        <button
          onClick={startSetup}
          disabled={loading}
          className="self-start btn-accent rounded px-4 py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Activar 2FA"}
        </button>
      )}
    </div>
  );
}
