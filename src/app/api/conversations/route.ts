import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: { select: { id: true, username: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({
    conversations: conversations
      .map((c) => {
        const others = c.participants.filter((p) => p.userId !== user.id).map((p) => p.user);
        const mine = c.participants.find((p) => p.userId === user.id)!;
        return {
          id: c.id,
          isGroup: c.isGroup,
          name: c.isGroup ? c.name : others[0]?.username,
          participants: others,
          lastMessage: c.messages[0]?.body ?? null,
          lastMessageAt: c.messages[0]?.createdAt ?? c.createdAt,
          unread: c.messages[0] ? c.messages[0].createdAt > mine.lastReadAt : false,
        };
      })
      .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt)),
  });
}

const createSchema = z.union([
  z.object({ username: z.string().trim().min(1) }),
  z.object({ name: z.string().trim().min(1).max(60), usernames: z.array(z.string().trim().min(1)).min(1).max(49) }),
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if ("username" in parsed.data) {
    if (parsed.data.username === user.username) {
      return NextResponse.json({ error: "No puedes chatear contigo mismo" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const areFriends = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: user.id, addresseeId: target.id },
          { requesterId: target.id, addresseeId: user.id },
        ],
      },
    });
    if (!areFriends) {
      return NextResponse.json({ error: "Solo puedes chatear con tus amigos" }, { status: 403 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: { every: { userId: { in: [user.id, target.id] } } },
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: target.id } } },
        ],
      },
    });
    if (existing) return NextResponse.json({ ok: true, id: existing.id });

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: { create: [{ userId: user.id }, { userId: target.id }] },
      },
    });
    return NextResponse.json({ ok: true, id: conversation.id });
  }

  const members = await prisma.user.findMany({
    where: { username: { in: parsed.data.usernames } },
    select: { id: true },
  });
  if (members.length === 0) {
    return NextResponse.json({ error: "Ningún usuario válido" }, { status: 400 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: parsed.data.name,
      participants: {
        create: [{ userId: user.id }, ...members.map((m) => ({ userId: m.id }))],
      },
    },
  });
  return NextResponse.json({ ok: true, id: conversation.id });
}
