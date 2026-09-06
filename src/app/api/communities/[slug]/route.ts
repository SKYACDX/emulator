import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteSharedFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (community.creatorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const posts = await prisma.communityPost.findMany({ where: { communityId: community.id } });
  await Promise.all(posts.filter((p) => p.imageKey).map((p) => deleteSharedFile(p.imageKey!).catch(() => {})));
  await prisma.communityPost.deleteMany({ where: { communityId: community.id } });
  await prisma.communityMembership.deleteMany({ where: { communityId: community.id } });
  await prisma.community.delete({ where: { id: community.id } });
  return NextResponse.json({ ok: true });
}
