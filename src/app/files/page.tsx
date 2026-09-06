import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import FilesSearchList from "@/components/FilesSearchList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archivos de la comunidad",
  description:
    "Capturas, guías, savestates y otros archivos relacionados con ROM hacks, compartidos por la comunidad.",
  alternates: { canonical: "/files" },
};

export default async function FilesPage() {
  const currentUser = await getCurrentUser();

  const where =
    currentUser?.role === "ADMIN"
      ? {}
      : {
          OR: [
            { isPublic: true },
            ...(currentUser ? [{ uploaderId: currentUser.id }] : []),
          ],
        };

  const [files, platforms] = await Promise.all([
    prisma.sharedFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { uploader: { select: { username: true } }, platform: true },
    }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Archivos de la comunidad</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">
            Capturas, guías, savestates y otros archivos relacionados con los
            hacks. No se permiten videos ni volcados de ROM/ISO. Los archivos
            privados solo los ve su dueño (y los admins).
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

      <FilesSearchList
        platforms={platforms.map((p) => p.name)}
        files={files.map((file) => ({
          id: file.id,
          title: file.title,
          description: file.description,
          originalName: file.originalName,
          fileSize: file.fileSize,
          isPublic: file.isPublic,
          platformName: file.platform?.name ?? null,
          gameTitle: file.gameTitle,
          coverImageUrl: file.coverImageUrl,
          uploader: file.uploader.username,
          createdAt: file.createdAt.toISOString(),
          canDelete:
            !!currentUser &&
            (currentUser.id === file.uploaderId || currentUser.role === "ADMIN"),
          canReport: !!currentUser && currentUser.id !== file.uploaderId,
        }))}
      />
    </div>
  );
}
