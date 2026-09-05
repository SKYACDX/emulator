import { prisma } from "@/lib/prisma";
import { corsJson, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  return corsJson({ platforms });
}
