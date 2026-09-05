"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UploadFileForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    const isPublic = formData.get("visibility") === "public";
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Selecciona un archivo");
      return;
    }

    setLoading(true);
    try {
      setStatus("Solicitando permiso de subida...");
      const presignRes = await fetch("/api/files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setError(presignData.error ?? "No se pudo iniciar la subida");
        return;
      }

      setStatus("Subiendo archivo...");
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) {
        setError("Falló la subida del archivo a almacenamiento");
        return;
      }

      setStatus("Guardando...");
      const createRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          storedName: presignData.storedName,
          originalName: file.name,
          isPublic,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        setError(createData.error ?? "No se pudo guardar el archivo");
        return;
      }

      router.push("/files");
      router.refresh();
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Título
        <input
          name="title"
          required
          maxLength={120}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Descripción (opcional)
        <textarea
          name="description"
          rows={4}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Archivo
        <input type="file" name="file" required className="text-neutral-300" />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm text-neutral-300">
        <legend className="mb-1">Visibilidad</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="visibility" value="public" defaultChecked />
          Público — cualquiera puede verlo y descargarlo
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="visibility" value="private" />
          Privado — solo tú (y los administradores) pueden verlo y descargarlo
        </label>
      </fieldset>

      {status && <p className="text-sm text-neutral-400">{status}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "Subiendo..." : "Subir archivo"}
      </button>
    </form>
  );
}
