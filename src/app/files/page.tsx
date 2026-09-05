import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import FileListItem from "@/components/FileListItem";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const [files, currentUser] = await Promise.all([
    prisma.sharedFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { uploader: { select: { username: true } } },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Archivos de la comunidad</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">
            Capturas, guías, savestates y otros archivos relacionados con los
            hacks. No se permiten videos ni volcados de ROM/ISO.
          </p>
        </div>
        {currentUser && (
          <Link
            href="/files/new"
            className="shrink-0 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Subir archivo
          </Link>
        )}
      </div>

      {files.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay archivos compartidos.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {files.map((file) => (
            <FileListItem
              key={file.id}
              file={{
                id: file.id,
                title: file.title,
                description: file.description,
                originalName: file.originalName,
                fileSize: file.fileSize,
                uploader: file.uploader.username,
                createdAt: file.createdAt.toISOString(),
              }}
              canDelete={
                !!currentUser &&
                (currentUser.id === file.uploaderId || currentUser.role === "ADMIN")
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
