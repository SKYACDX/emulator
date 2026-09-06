import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteSharedFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { slug, postId } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: { community: true },
  });
  if (!post || post.community.slug !== slug) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const isOwner = post.community.creatorId === user.id;
  if (post.authorId !== user.id && !isOwner && user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (post.imageKey) await deleteSharedFile(post.imageKey).catch(() => {});
  await prisma.communityPost.delete({ where: { id: postId } });

  return NextResponse.json({ ok: true });
}
