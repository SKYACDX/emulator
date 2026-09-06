import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { headObject } from "@/lib/storage";

const MAX_IMAGE_BYTES = 8_000_000;

async function requireMembership(slug: string, userId: string) {
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return { error: NextResponse.json({ error: "No encontrada" }, { status: 404 }) };

  const membership = await prisma.communityMembership.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  });
  if (!membership) {
    return { error: NextResponse.json({ error: "Debes unirte a la comunidad primero" }, { status: 403 }) };
  }
  return { community };
}

const createSchema = z.object({
  body: z.string().trim().min(1, "Escribe algo").max(2000),
  imageKey: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { slug } = await params;
  const result = await requireMembership(slug, user.id);
  if ("error" in result) return result.error;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  let imageKey: string | null = null;
  if (parsed.data.imageKey) {
    if (!parsed.data.imageKey.startsWith(`community-posts/${user.id}/`)) {
      return NextResponse.json({ error: "Imagen no permitida" }, { status: 400 });
    }
    const info = await headObject(parsed.data.imageKey);
    if (!info || info.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Imagen inválida o demasiado grande" }, { status: 400 });
    }
    imageKey = parsed.data.imageKey;
  }

  const post = await prisma.communityPost.create({
    data: {
      body: parsed.data.body,
      imageKey,
      communityId: result.community.id,
      authorId: user.id,
    },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
