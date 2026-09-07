import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";
import { serializeEmulatorTheme } from "@/lib/emulatorThemes";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theme = await prisma.emulatorTheme.findUnique({
    where: { id },
    include: { author: { select: { username: true } } },
  });

  if (!theme || !theme.isPublic) {
    return corsJson({ error: "Tema no encontrado" }, { status: 404, cache: false });
  }

  return corsJson({ theme: serializeEmulatorTheme(theme) });
}
