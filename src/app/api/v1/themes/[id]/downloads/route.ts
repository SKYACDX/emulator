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
  if (!(await checkRateLimit(`theme-download:${clientIp(request)}`, 60, 60 * 1000))) {
    return corsJson({ error: "Demasiadas solicitudes" }, { status: 429, cache: false });
  }

  const { id } = await params;
  const theme = await prisma.emulatorTheme.findUnique({ where: { id } });
  if (!theme || !theme.isPublic) {
    return corsJson({ error: "Tema no encontrado" }, { status: 404, cache: false });
  }

  await prisma.emulatorTheme.update({ where: { id }, data: { downloads: { increment: 1 } } });

  return new Response(null, { status: 204 });
}
