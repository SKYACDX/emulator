import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const addSchema = z.object({ username: z.string().trim().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || !conversation.isGroup) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const membership = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.conversationParticipant
    .create({ data: { conversationId: id, userId: target.id } })
    .catch(() => {}); // already a member — no-op

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || !conversation.isGroup) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.conversationParticipant.deleteMany({ where: { conversationId: id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
