"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      {mode === "register" && (
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Nombre de usuario
          <input
            name="username"
            required
            minLength={3}
            maxLength={24}
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Correo electrónico
        <input
          type="email"
          name="email"
          required
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Contraseña
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
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
