"use client";

import { useMemo, useState } from "react";
import FileListItem from "./FileListItem";

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
  canDelete: boolean;
};

export default function FilesSearchList({ files }: { files: SharedFile[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) =>
      [
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
        .includes(q)
    );
  }, [files, query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título, juego, plataforma, archivo o usuario..."
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
      />

      {filtered.length === 0 ? (
        <p className="text-neutral-500">
          {files.length === 0
            ? "Todavía no hay archivos compartidos."
            : "Ningún archivo coincide con tu búsqueda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((file) => (
            <FileListItem key={file.id} file={file} canDelete={file.canDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
