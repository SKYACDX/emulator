import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkRateLimit(`app-release-download:${clientIp(request)}`, 60, 60 * 1000))) {
    return corsJson({ error: "Demasiadas solicitudes" }, { status: 429, cache: false });
  }

  const { id } = await params;
  const release = await prisma.appRelease.findUnique({ where: { id } });
  if (!release) {
    return corsJson({ error: "Versión no encontrada" }, { status: 404, cache: false });
  }

  await prisma.appRelease.update({ where: { id }, data: { downloads: { increment: 1 } } });

  return new Response(null, { status: 204 });
}
