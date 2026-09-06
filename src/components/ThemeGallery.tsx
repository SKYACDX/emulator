"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyLivePreview,
  clearLivePreview,
  CUSTOM_THEME_ID,
  type CustomThemeColors,
} from "@/lib/themes";

type CommunityTheme = {
  id: string;
  name: string;
  bg: string;
  surface: string;
  accent: string;
  text: string;
  creator: string;
  creatorId: string;
};

export default function ThemeGallery({
  themes,
  currentUserId,
  isAdmin,
}: {
  themes: CommunityTheme[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function colorsOf(theme: CommunityTheme): CustomThemeColors {
    return { bg: theme.bg, surface: theme.surface, accent: theme.accent, text: theme.text };
  }

  function handlePreview(theme: CommunityTheme) {
    applyLivePreview(colorsOf(theme));
    setPreviewing(theme.id);
  }

  function handleStopPreview() {
    setPreviewing(null);
    clearLivePreview();
    router.refresh();
  }

  async function handleUse(theme: CommunityTheme) {
    if (!currentUserId) {
      setError("Inicia sesión para usar un tema");
      return;
    }
    setError(null);
    setApplying(theme.id);
    try {
      const res = await fetch("/api/me/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: CUSTOM_THEME_ID, customColors: colorsOf(theme) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo aplicar el tema");
        return;
      }
      setPreviewing(null);
      router.refresh();
    } finally {
      setApplying(null);
    }
  }

  async function handleDelete(theme: CommunityTheme) {
    if (!confirm(`¿Eliminar el tema "${theme.name}" de la galería?`)) return;
    setError(null);
    setDeleting(theme.id);
    try {
      const res = await fetch(`/api/community-themes/${theme.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (themes.length === 0) {
    return (
      <p className="text-muted">
        Todavía no hay temas compartidos. Crea uno personalizado en{" "}
        <a href="/me" className="text-accent underline">
          tu perfil
        </a>{" "}
        y compártelo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {previewing && (
        <div className="border-accent bg-surface flex items-center justify-between rounded-lg border p-3 text-sm">
          <span className="text-base">
            Viendo una vista previa sin guardar de "
            {themes.find((t) => t.id === previewing)?.name}".
          </span>
          <button
            onClick={handleStopPreview}
            className="bg-page hover-surface rounded px-3 py-1 text-base"
          >
            Salir de la vista previa
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {themes.map((theme) => {
          const canDelete = isAdmin || theme.creatorId === currentUserId;
          return (
            <div
              key={theme.id}
              className="border-base flex flex-col overflow-hidden rounded-lg border"
            >
              <button
                type="button"
                onClick={() => handlePreview(theme)}
                className="flex flex-col gap-2 p-4 text-left"
                style={{ backgroundColor: theme.bg }}
              >
                <div
                  className="rounded p-2 text-sm"
                  style={{ backgroundColor: theme.surface, color: theme.text }}
                >
                  Vista previa
                </div>
                <span
                  className="inline-block self-start rounded px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: theme.accent, color: "#fff" }}
                >
                  Acento
                </span>
              </button>
              <div className="bg-surface flex flex-col gap-2 p-3">
                <div>
                  <p className="text-base text-sm font-medium">{theme.name}</p>
                  <p className="text-muted text-xs">por {theme.creator}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUse(theme)}
                    disabled={applying === theme.id}
                    className="btn-accent flex-1 rounded px-2 py-1.5 text-xs font-medium disabled:opacity-60"
                  >
                    {applying === theme.id ? "Aplicando..." : "Usar este tema"}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(theme)}
                      disabled={deleting === theme.id}
                      className="rounded bg-red-700 px-2 py-1.5 text-xs text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
