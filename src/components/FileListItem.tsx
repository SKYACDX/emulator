"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SharedFile = {
  id: string;
  title: string;
  description: string;
  originalName: string;
  fileSize: number;
  isPublic: boolean;
  uploader: string;
  createdAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileListItem({
  file,
  canDelete,
}: {
  file: SharedFile;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${file.title}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-white">{file.title}</h2>
            <span
              className={
                file.isPublic
                  ? "rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
                  : "rounded bg-amber-900 px-2 py-0.5 text-xs text-amber-300"
              }
            >
              {file.isPublic ? "Público" : "Privado"}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            {file.originalName} · {formatBytes(file.fileSize)} · subido por{" "}
            {file.uploader}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/api/files/${file.id}/download`}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
          >
            Descargar
          </a>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={pending}
              className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
            >
              {pending ? "..." : "Eliminar"}
            </button>
          )}
        </div>
      </div>
      {file.description && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-400">
          {file.description}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </li>
  );
}
