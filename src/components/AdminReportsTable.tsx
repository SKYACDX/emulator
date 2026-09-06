"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Report = {
  id: string;
  reason: string;
  reporter: string;
  createdAt: string;
};

type ReportedFile = {
  id: string;
  title: string;
  uploader: string;
  reports: Report[];
};

export default function AdminReportsTable({ files }: { files: ReportedFile[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDismiss(file: ReportedFile) {
    setError(null);
    setPendingId(file.id);
    try {
      const res = await fetch(`/api/admin/files/${file.id}/reports`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo descartar");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(file: ReportedFile) {
    if (!confirm(`¿Eliminar "${file.title}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    setPendingId(file.id);
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (files.length === 0) {
    return <p className="text-muted">No hay archivos reportados.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {files.map((file) => (
        <div
          key={file.id}
          className="rounded-lg border border-amber-900/50 bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium text-base">{file.title}</span>
              <span className="ml-2 text-xs text-muted">
                subido por {file.uploader} · {file.reports.length} reporte(s)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(file)}
                disabled={pendingId === file.id}
                className="rounded bg-surface px-3 py-1.5 text-sm text-base hover-surface disabled:opacity-60"
              >
                Descartar reportes
              </button>
              <button
                onClick={() => handleDelete(file)}
                disabled={pendingId === file.id}
                className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
              >
                Eliminar archivo
              </button>
            </div>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {file.reports.map((r) => (
              <li key={r.id} className="text-sm text-muted">
                <span className="text-amber-300">{r.reason}</span> — reportado por{" "}
                {r.reporter}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
