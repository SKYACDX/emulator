"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AvatarUpload({ initialUrl }: { initialUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const presignRes = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setError(presignData.error ?? "No se pudo subir");
        return;
      }
      await fetch(presignData.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const confirmRes = await fetch("/api/me/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storedName: presignData.storedName }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        setError(confirmData.error ?? "No se pudo guardar");
        return;
      }
      setUrl(confirmData.avatarUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? "/default-avatar.svg"}
        alt="Tu avatar"
        className="border-base h-16 w-16 rounded-full border object-cover"
      />
      <label className="bg-surface hover-surface cursor-pointer rounded px-3 py-2 text-sm text-base">
        {loading ? "Subiendo..." : "Cambiar foto"}
        <input type="file" accept="image/*" onChange={handleChange} className="hidden" disabled={loading} />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
