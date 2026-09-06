import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  await prisma.communityMembership
    .create({ data: { communityId: community.id, userId: user.id } })
    .catch(() => {}); // already a member — no-op

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (community.creatorId === user.id) {
    return NextResponse.json(
      { error: "El creador no puede salir — elimina la comunidad en su lugar" },
      { status: 400 }
    );
  }

  await prisma.communityMembership.deleteMany({
    where: { communityId: community.id, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
