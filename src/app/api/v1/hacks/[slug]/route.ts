import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";
import { serializeHack } from "@/lib/apiSerializers";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const hack = await prisma.hack.findUnique({
    where: { slug },
    include: {
      game: { include: { platform: true } },
      author: { select: { username: true } },
      patches: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!hack) {
    return corsJson({ error: "Hack no encontrado" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  return corsJson({ hack: serializeHack(hack, origin) });
}
