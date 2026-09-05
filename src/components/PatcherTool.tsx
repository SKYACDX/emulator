"use client";

import { useState, type ChangeEvent } from "react";
import { applyPatch, detectPatchExt } from "@/lib/patchers";

export default function PatcherTool() {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleRomChange(e: ChangeEvent<HTMLInputElement>) {
    setRomFile(e.target.files?.[0] ?? null);
    setStatus(null);
    setError(null);
    setWarning(null);
  }

  function handlePatchChange(e: ChangeEvent<HTMLInputElement>) {
    setPatchFile(e.target.files?.[0] ?? null);
    setStatus(null);
    setError(null);
    setWarning(null);
  }

  async function handleApply() {
    if (!romFile || !patchFile) return;
    setError(null);
    setWarning(null);
    setStatus(null);
    setBusy(true);

    try {
      const ext = detectPatchExt(patchFile.name);
      if (!ext) {
        setError("Formato de parche no soportado en el navegador (usa .ips, .bps o .ups; para .xdelta usa xdelta3 localmente).");
        return;
      }

      const [romBytes, patchBytes] = await Promise.all([
        romFile.arrayBuffer().then((b) => new Uint8Array(b)),
        patchFile.arrayBuffer().then((b) => new Uint8Array(b)),
      ]);

      const { output, warning: applyWarning } = applyPatch(romBytes, patchBytes, ext);
      if (applyWarning) setWarning(applyWarning);

      const blob = new Blob([new Uint8Array(output)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName = romFile.name.replace(/\.[^/.]+$/, "");
      a.href = url;
      a.download = `${baseName}-parcheado${getExtension(romFile.name)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("¡Parche aplicado! La descarga debería comenzar automáticamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar el parche");
    } finally {
      setBusy(false);
    }
  }

  function getExtension(filename: string): string {
    const match = filename.match(/\.[^/.]+$/);
    return match ? match[0] : "";
  }

  return (
    <div className="flex max-w-lg flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        1. Tu ROM original (nunca sale de tu equipo)
        <input type="file" onChange={handleRomChange} className="text-neutral-300" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        2. Archivo de parche (.ips, .bps, .ups)
        <input
          type="file"
          accept=".ips,.bps,.ups"
          onChange={handlePatchChange}
          className="text-neutral-300"
        />
      </label>

      <button
        onClick={handleApply}
        disabled={!romFile || !patchFile || busy}
        className="self-start rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy ? "Aplicando..." : "Aplicar parche y descargar"}
      </button>

      {status && <p className="text-sm text-emerald-400">{status}</p>}
      {warning && <p className="text-sm text-amber-400">{warning}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
