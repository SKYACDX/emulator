"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_REASONS } from "@/lib/fileReports";

type SharedFile = {
  id: string;
  title: string;
  description: string;
  originalName: string;
  fileSize: number;
  isPublic: boolean;
  platformName: string | null;
  gameTitle: string | null;
  coverImageUrl: string | null;
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
  canReport,
}: {
  file: SharedFile;
  canDelete: boolean;
  canReport: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");

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

  async function handleReport() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/files/${file.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar el reporte");
        return;
      }
      setReportSent(true);
      setReporting(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex gap-3">
          {file.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.coverImageUrl}
              alt={file.gameTitle ?? file.title}
              className="h-14 w-auto shrink-0 rounded border border-neutral-800"
            />
          )}
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
              {(file.platformName || file.gameTitle) && (
                <span className="rounded bg-sky-900 px-2 py-0.5 text-xs text-sky-300">
                  {[file.platformName, file.gameTitle].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {file.originalName} · {formatBytes(file.fileSize)} · subido por{" "}
              {file.uploader}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/api/files/${file.id}/download`}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
          >
            Descargar
          </a>
          {canReport && !reportSent && (
            <button
              onClick={() => setReporting((v) => !v)}
              className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
            >
              Reportar
            </button>
          )}
          {reportSent && (
            <span className="self-center text-sm text-neutral-500">Reportado</span>
          )}
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

      {reporting && (
        <div className="mt-3 flex flex-col gap-2 rounded border border-neutral-800 bg-neutral-950 p-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-300">
            Motivo del reporte
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {reason === "Otro" && (
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe el motivo"
              maxLength={500}
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={pending}
              className="rounded bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-60"
            >
              {pending ? "Enviando..." : "Enviar reporte"}
            </button>
            <button
              onClick={() => setReporting(false)}
              className="rounded bg-neutral-800 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </li>
  );
}
