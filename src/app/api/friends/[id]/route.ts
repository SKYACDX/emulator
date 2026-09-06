import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Accept an incoming friend request.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.addresseeId !== user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.friendship.update({ where: { id }, data: { status: "accepted" } });
  return NextResponse.json({ ok: true });
}

// Reject a pending request, cancel one you sent, or remove an existing friend.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || (friendship.requesterId !== user.id && friendship.addresseeId !== user.id)) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
