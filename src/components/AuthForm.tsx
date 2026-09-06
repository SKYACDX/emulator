"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload =
      mode === "login"
        ? {
            email: formData.get("email"),
            password: formData.get("password"),
          }
        : {
            email: formData.get("email"),
            username: formData.get("username"),
            password: formData.get("password"),
          };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }
      if (data.requiresTotp) {
        setPendingToken(data.pendingToken);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código incorrecto");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <form onSubmit={handleTotpSubmit} className="flex max-w-sm flex-col gap-4">
        <p className="text-sm text-muted">
          Ingresa el código de 6 dígitos de tu app de autenticación.
        </p>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Código de verificación
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required
            autoFocus
            inputMode="numeric"
            maxLength={8}
            className="rounded border border-base bg-surface px-3 py-2 text-base tracking-widest"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-accent rounded px-4 py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      {mode === "register" && (
        <label className="flex flex-col gap-1 text-sm text-muted">
          Nombre de usuario
          <input
            name="username"
            required
            minLength={3}
            maxLength={24}
            className="rounded border border-base bg-surface px-3 py-2 text-base"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm text-muted">
        Correo electrónico
        <input
          type="email"
          name="email"
          required
          className="rounded border border-base bg-surface px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Contraseña
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded border border-base bg-surface px-3 py-2 text-base"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-accent rounded px-4 py-2 font-medium disabled:opacity-60"
      >
        {loading
          ? "Enviando..."
          : mode === "login"
          ? "Iniciar sesión"
          : "Crear cuenta"}
      </button>
    </form>
  );
}
