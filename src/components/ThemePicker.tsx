"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  THEMES,
  CUSTOM_THEME_META,
  CUSTOM_THEME_ID,
  type CustomThemeColors,
} from "@/lib/themes";

export default function ThemePicker({
  currentTheme,
  initialCustomColors,
}: {
  currentTheme: string;
  initialCustomColors: CustomThemeColors;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentTheme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCustom, setEditingCustom] = useState(currentTheme === CUSTOM_THEME_ID);
  const [customColors, setCustomColors] = useState<CustomThemeColors>(initialCustomColors);

  async function saveTheme(themeId: string, colors?: CustomThemeColors) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId, customColors: colors }),
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

  function handleSelectPreset(themeId: string) {
    setEditingCustom(false);
    if (themeId === selected) return;
    saveTheme(themeId);
  }

  function handleOpenCustom() {
    setEditingCustom(true);
  }

  function handleCustomColorChange(field: keyof CustomThemeColors, value: string) {
    setCustomColors((prev) => ({ ...prev, [field]: value }));
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
              onClick={() => handleSelectPreset(theme.id)}
              disabled={loading}
              className={
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition disabled:opacity-60 " +
                (isSelected
                  ? "border-2"
                  : "border-base bg-surface hover-border")
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
              <span className="text-sm text-base">{theme.name}</span>
              {isSelected && <span className="text-xs text-muted">Activo</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleOpenCustom}
          disabled={loading}
          className={
            "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition disabled:opacity-60 " +
            (selected === CUSTOM_THEME_ID
              ? "border-2"
              : "border-base bg-surface hover-border")
          }
          style={
            selected === CUSTOM_THEME_ID
              ? {
                  borderColor: customColors.accent,
                  backgroundColor: `${customColors.accent}1a`,
                }
              : undefined
          }
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: customColors.accent, color: "#fff" }}
          >
            {CUSTOM_THEME_META.icon}
          </span>
          <span className="text-sm text-base">{CUSTOM_THEME_META.name}</span>
          {selected === CUSTOM_THEME_ID && <span className="text-xs text-muted">Activo</span>}
        </button>
      </div>

      {editingCustom && (
        <div className="border-base bg-surface flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-base text-sm">Elige tus propios colores</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ColorField
              label="Fondo"
              value={customColors.bg}
              onChange={(v) => handleCustomColorChange("bg", v)}
            />
            <ColorField
              label="Superficie"
              value={customColors.surface}
              onChange={(v) => handleCustomColorChange("surface", v)}
            />
            <ColorField
              label="Acento"
              value={customColors.accent}
              onChange={(v) => handleCustomColorChange("accent", v)}
            />
            <ColorField
              label="Texto"
              value={customColors.text}
              onChange={(v) => handleCustomColorChange("text", v)}
            />
          </div>
          <button
            type="button"
            onClick={() => saveTheme(CUSTOM_THEME_ID, customColors)}
            disabled={loading}
            className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: customColors.accent }}
          >
            {loading ? "Guardando..." : "Guardar tema personalizado"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-muted flex flex-col items-center gap-1 text-xs">
      {label}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="font-mono">{value}</span>
    </label>
  );
}

