"use client";

import { useState } from "react";

export default function SavedGamesVisibility({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: boolean) {
    setError(null);
    setSaving(true);
    setChecked(next);
    try {
      const res = await fetch("/api/me/saved-games-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showSavedGameTitles: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar");
        setChecked(!next);
      }
    } catch {
      setError("No se pudo guardar");
      setChecked(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm text-base">
        <input
          type="checkbox"
          checked={checked}
          disabled={saving}
          onChange={(e) => handleChange(e.target.checked)}
        />
        Mostrar los nombres de los juegos en mi perfil público
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
