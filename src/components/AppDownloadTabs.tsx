"use client";

import { useState } from "react";

type Release = {
  id: string;
  version: string;
  changelog: string;
  minAndroidSdk: number | null;
  apkUrl: string | null;
  apkSize: number;
  downloads: number;
} | null;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TABS = [
  { key: "ANDROID" as const, label: "Android", buttonLabel: "Descargar APK" },
  { key: "WINDOWS" as const, label: "Windows", buttonLabel: "Descargar .exe" },
];

export default function AppDownloadTabs({
  releases,
}: {
  releases: Record<"ANDROID" | "WINDOWS", Release>;
}) {
  const available = TABS.filter((t) => releases[t.key]);
  const [active, setActive] = useState(available[0]?.key ?? "ANDROID");

  if (available.length === 0) return null;

  const release = releases[active];
  const tab = TABS.find((t) => t.key === active)!;

  return (
    <div className="flex flex-col gap-3">
      {available.length > 1 && (
        <div className="flex gap-2">
          {available.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={
                t.key === active
                  ? "btn-accent rounded px-4 py-1.5 text-sm font-medium"
                  : "bg-surface hover-surface rounded px-4 py-1.5 text-sm text-base"
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {release && (
        <div className="game-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-base font-medium">
              Versión {release.version}
              {active === "ANDROID" && release.minAndroidSdk
                ? ` · requiere Android API ${release.minAndroidSdk}+`
                : ""}
              {active === "WINDOWS" ? " · Windows 10/11 64-bit" : ""}
            </p>
            <p className="text-muted text-sm">
              {formatBytes(release.apkSize)} · {release.downloads} descarga
              {release.downloads === 1 ? "" : "s"}
            </p>
          </div>
          <a
            href={`/api/app/releases/${release.id}/download`}
            className="btn-accent glow-accent rounded px-5 py-2.5 text-sm font-medium"
          >
            {tab.buttonLabel}
          </a>
        </div>
      )}

      {release?.changelog && (
        <section>
          <h2 className="font-pixel mb-3 text-[13px] tracking-wide text-base">
            Novedades de la versión {release.version}
          </h2>
          <p className="text-muted whitespace-pre-wrap text-sm">{release.changelog}</p>
        </section>
      )}
    </div>
  );
}
