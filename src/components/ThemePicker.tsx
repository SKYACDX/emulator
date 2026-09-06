"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes";

export default function ThemePicker({ currentTheme }: { currentTheme: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentTheme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(themeId: string) {
    if (themeId === selected) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar el tema");
        return;
      }
      setSelected(themeId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((theme) => {
          const isSelected = theme.id === selected;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              disabled={loading}
              className={
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition disabled:opacity-60 " +
                (isSelected
                  ? "border-2"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-700")
              }
              style={
                isSelected
                  ? { borderColor: theme.accent, backgroundColor: `${theme.accent}1a` }
                  : undefined
              }
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                {theme.icon}
              </span>
              <span className="text-sm text-white">{theme.name}</span>
              {isSelected && <span className="text-xs text-neutral-400">Activo</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
