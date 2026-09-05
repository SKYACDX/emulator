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
      <div className="flex max-w-sm flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm text-neutral-300">
          Escanea este código con Google Authenticator, Authy, o cualquier app
          compatible con TOTP.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={setupData.qrCodeDataUrl}
          alt="Código QR para configurar 2FA"
          className="h-48 w-48 self-center rounded bg-white p-2"
        />
        <p className="text-xs text-neutral-500">
          ¿No puedes escanear? Ingresa esta clave manualmente:
          <br />
          <code className="text-neutral-300">{setupData.secret}</code>
        </p>
        <form onSubmit={handleConfirm} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Código de 6 dígitos
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
              inputMode="numeric"
              maxLength={8}
              className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white tracking-widest"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Confirmar y activar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupData(null);
                setError(null);
              }}
              className="rounded bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-700"
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
        className="flex max-w-sm flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
      >
        <p className="text-sm text-neutral-300">
          Para desactivar la verificación en dos pasos, confirma tu contraseña
          y un código actual de tu app de autenticación.
        </p>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Código de 6 dígitos
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputMode="numeric"
            maxLength={8}
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white tracking-widest"
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
            className="rounded bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-300">
          Verificación en dos pasos (2FA)
        </span>
        <span
          className={
            enabled
              ? "rounded bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300"
              : "rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
          }
        >
          {enabled ? "Activada" : "Desactivada"}
        </span>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {enabled ? (
        <button
          onClick={() => setDisabling(true)}
          className="self-start rounded bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-700"
        >
          Desactivar 2FA
        </button>
      ) : (
        <button
          onClick={startSetup}
          disabled={loading}
          className="self-start rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Activar 2FA"}
        </button>
      )}
    </div>
  );
}
