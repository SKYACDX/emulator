"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Feedback = {
  id: string;
  body: string;
  deviceInfo: string | null;
  appVersion: string | null;
  imageUrl: string | null;
  author: string;
  createdAt: string;
  canDelete: boolean;
};

export default function AppFeedback({
  isLoggedIn,
  feedback,
}: {
  isLoggedIn: boolean;
  feedback: Feedback[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [guestName, setGuestName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setLoading(true);
    try {
      let imageKey: string | undefined;
      if (image) {
        const presignRes = await fetch("/api/app/feedback/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: image.name, contentType: image.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          setError(presignData.error ?? "No se pudo subir la imagen");
          return;
        }
        await fetch(presignData.uploadUrl, {
          method: "PUT",
          body: image,
          headers: { "Content-Type": image.type },
        });
        imageKey = presignData.storedName;
      }

      const res = await fetch("/api/app/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          deviceInfo: deviceInfo || undefined,
          appVersion: appVersion || undefined,
          guestName: !isLoggedIn && guestName ? guestName : undefined,
          imageKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar");
        return;
      }
      setBody("");
      setDeviceInfo("");
      setAppVersion("");
      setGuestName("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    await fetch(`/api/app/feedback/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="border-base bg-surface flex flex-col gap-3 rounded-lg border p-4">
        {!isLoggedIn && (
          <p className="text-muted text-xs">
            Puedes enviar sin cuenta.{" "}
            <Link href="/register" className="text-accent underline">
              Crear una cuenta
            </Link>{" "}
            ayuda a que le demos seguimiento a tu reporte.
          </p>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="¿Qué te parece la app? ¿Encontraste un error? Descríbelo aquí."
          rows={3}
          maxLength={2000}
          className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!isLoggedIn && (
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              maxLength={60}
              className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
            />
          )}
          <input
            value={deviceInfo}
            onChange={(e) => setDeviceInfo(e.target.value)}
            placeholder="Dispositivo (ej. Samsung Galaxy S21, Android 13)"
            maxLength={200}
            className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
          />
          <input
            value={appVersion}
            onChange={(e) => setAppVersion(e.target.value)}
            placeholder="Versión de la app (ej. 1.0)"
            maxLength={50}
            className="border-base bg-page rounded border px-3 py-2 text-sm text-base"
          />
        </div>
        <label className="text-muted flex flex-col gap-1 text-xs">
          Captura de pantalla (opcional)
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="btn-accent self-start rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar comentario"}
        </button>
      </form>

      <ul className="flex flex-col gap-3">
        {feedback.map((f) => (
          <li key={f.id} className="border-base bg-surface rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-sm font-medium">{f.author}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs">
                  {new Date(f.createdAt).toLocaleDateString("es")}
                </span>
                {f.canDelete && (
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            {(f.deviceInfo || f.appVersion) && (
              <p className="text-muted mt-0.5 text-xs">
                {[f.deviceInfo, f.appVersion && `v${f.appVersion}`].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-base mt-1 whitespace-pre-wrap text-sm">{f.body}</p>
            {f.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.imageUrl}
                alt=""
                className="border-base mt-2 max-h-64 rounded border object-contain"
              />
            )}
          </li>
        ))}
        {feedback.length === 0 && (
          <p className="text-muted text-sm">Todavía no hay comentarios.</p>
        )}
      </ul>
    </div>
  );
}
