"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/fileReports";

type SharedFile = {
  id: string;
  title: string;
  description: string;
  originalName: string;
  fileSize: number;
  downloadCount: number;
  isPublic: boolean;
  platformName: string | null;
  gameTitle: string | null;
  coverImageUrl: string | null;
  virusScanStatus: string;
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
  canRescan,
}: {
  file: SharedFile;
  canDelete: boolean;
  canReport: boolean;
  canRescan: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [rescanning, setRescanning] = useState(false);
  const [rescanResult, setRescanResult] = useState<string | null>(null);

  async function handleRescan() {
    setError(null);
    setRescanning(true);
    setRescanResult(null);
    try {
      const res = await fetch(`/api/admin/files/${file.id}/rescan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo reescanear");
        return;
      }
      if (data.deleted) {
        setRescanResult("Detectado como malicioso — eliminado.");
        router.refresh();
        return;
      }
      setRescanResult(
        data.verdict === "clean" ? "Limpio confirmado." : `Sigue en: ${data.verdict}`
      );
      router.refresh();
    } finally {
      setRescanning(false);
    }
  }

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
    <li className="game-card flex h-full flex-col overflow-hidden">
      <div className="border-base bg-page relative aspect-[3/4] w-full border-b">
        {file.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.coverImageUrl}
            alt={file.gameTitle ?? file.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted flex h-full w-full items-center justify-center text-xs">
            Sin portada
          </div>
        )}
        <span
          className={
            file.isPublic
              ? "absolute top-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-muted"
              : "absolute top-1.5 left-1.5 rounded bg-amber-900/90 px-1.5 py-0.5 text-[10px] text-amber-300"
          }
        >
          {file.isPublic ? "Público" : "Privado"}
        </span>
        {(file.platformName || file.gameTitle) && (
          <span className="badge-accent absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium">
            {[file.platformName, file.gameTitle].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="text-base text-sm font-medium">{file.title}</h2>
          {file.virusScanStatus === "pending" && (
            <span
              className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] text-amber-300"
              title="El escaneo antivirus de VirusTotal todavía no terminó cuando se subió"
            >
              Escaneo pendiente
            </span>
          )}
          {file.virusScanStatus === "error" && (
            <span
              className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] text-amber-300"
              title="No se pudo completar el escaneo antivirus"
            >
              Sin escanear
            </span>
          )}
          {canRescan && (file.virusScanStatus === "pending" || file.virusScanStatus === "error") && (
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="hover-surface bg-surface rounded px-1.5 py-0.5 text-[10px] text-base disabled:opacity-60"
            >
              {rescanning ? "Reescaneando..." : "Reescanear"}
            </button>
          )}
          {rescanResult && <span className="text-muted text-[10px]">{rescanResult}</span>}
        </div>

        {file.description && (
          <p className="text-muted line-clamp-2 text-xs">{file.description}</p>
        )}

        <p className="text-muted mt-auto text-xs">
          {file.originalName} · {formatBytes(file.fileSize)} · {file.downloadCount} descarga
          {file.downloadCount === 1 ? "" : "s"}
        </p>
        <p className="text-muted text-xs">
          subido por{" "}
          <Link href={`/u/${file.uploader}`} className="hover-text-accent">
            {file.uploader}
          </Link>
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`/api/files/${file.id}/download`}
            className="btn-accent flex-1 rounded px-3 py-1.5 text-center text-sm"
          >
            Descargar
          </a>
          {canReport && !reportSent && (
            <button
              onClick={() => setReporting((v) => !v)}
              className="bg-surface hover-surface rounded px-3 py-1.5 text-sm text-base"
            >
              Reportar
            </button>
          )}
          {reportSent && <span className="text-muted self-center text-xs">Reportado</span>}
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

        {reporting && (
          <div className="border-base bg-page flex flex-col gap-2 rounded border p-3">
            <label className="text-muted flex flex-col gap-1 text-sm">
              Motivo del reporte
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border-base bg-surface rounded border px-3 py-2 text-base"
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
                className="border-base bg-surface rounded border px-3 py-2 text-base"
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
                className="bg-surface hover-surface rounded px-3 py-1.5 text-sm text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </li>
  );
}
