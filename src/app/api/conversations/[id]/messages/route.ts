import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    return { error: NextResponse.json({ error: "No encontrada" }, { status: 404 }) };
  }
  return { participant };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const result = await requireParticipant(id, user.id);
  if ("error" in result) return result.error;

  const after = new URL(request.url).searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: { conversationId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    include: { sender: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.conversationParticipant.update({
    where: { id: result.participant.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender.username,
      mine: m.senderId === user.id,
    })),
  });
}

const sendSchema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!(await checkRateLimit(`message-send:${user.id}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Estás enviando mensajes muy rápido" }, { status: 429 });
  }

  const { id } = await params;
  const result = await requireParticipant(id, user.id);
  if ("error" in result) return result.error;

  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe un mensaje" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, body: parsed.data.body },
  });

  return NextResponse.json({ ok: true, id: message.id, createdAt: message.createdAt.toISOString() });
}
