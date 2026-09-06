import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const file = await prisma.sharedFile.findUnique({
    where: { id },
    include: { uploader: { select: { username: true } }, platform: true },
  });

  // Never expose a private or not-yet-confirmed-clean file through the
  // public API, and 404 either way so its existence isn't leaked.
  const scanCleared =
    file?.virusScanStatus === "clean" || file?.virusScanStatus === "skipped";
  if (!file || !file.isPublic || !scanCleared) {
    return corsJson({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  return corsJson({
    file: {
      id: file.id,
      title: file.title,
      description: file.description,
      originalName: file.originalName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      platform: file.platform ? { slug: file.platform.slug, name: file.platform.name } : null,
      gameTitle: file.gameTitle,
      coverImageUrl: file.coverImageUrl,
      uploader: file.uploader.username,
      createdAt: file.createdAt.toISOString(),
      downloadUrl: `${origin}/api/files/${file.id}/download`,
    },
  });
}
