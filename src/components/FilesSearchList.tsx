"use client";

import { useMemo, useState } from "react";
import FileListItem from "./FileListItem";

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
  canDelete: boolean;
  canReport: boolean;
  canRescan: boolean;
};

const OTHER_PLATFORM = "Otros";

export default function FilesSearchList({
  files,
  platforms,
}: {
  files: SharedFile[];
  platforms: string[];
}) {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((file) => {
      if (platformFilter) {
        const effectivePlatform = file.platformName ?? OTHER_PLATFORM;
        if (effectivePlatform !== platformFilter) return false;
      }
      if (!q) return true;
      return [
        file.title,
        file.description,
        file.originalName,
        file.uploader,
        file.platformName,
        file.gameTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [files, query, platformFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, juego, plataforma, archivo o usuario..."
          className="flex-1 rounded border border-base bg-surface px-3 py-2 text-base"
        />
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded border border-base bg-surface px-3 py-2 text-base sm:w-56"
        >
          <option value="">Todas las plataformas</option>
          {platforms.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={OTHER_PLATFORM}>{OTHER_PLATFORM}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">
          {files.length === 0
            ? "Todavía no hay archivos compartidos."
            : "Ningún archivo coincide con tu búsqueda."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((file) => (
            <FileListItem
              key={file.id}
              file={file}
              canDelete={file.canDelete}
              canReport={file.canReport}
              canRescan={file.canRescan}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
