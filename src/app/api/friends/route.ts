import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = rows
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requesterId === user.id ? f.addressee : f.requester));
  const incoming = rows
    .filter((f) => f.status === "pending" && f.addresseeId === user.id)
    .map((f) => ({ id: f.id, user: f.requester }));
  const outgoing = rows
    .filter((f) => f.status === "pending" && f.requesterId === user.id)
    .map((f) => ({ id: f.id, user: f.addressee }));

  return NextResponse.json({ friends, incoming, outgoing });
}

const requestSchema = z.object({ username: z.string().trim().min(1) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.id === user.id) {
    return NextResponse.json({ error: "No puedes agregarte a ti mismo" }, { status: 400 });
  }

  const reverse = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId: target.id, addresseeId: user.id } },
  });
  if (reverse) {
    if (reverse.status === "accepted") {
      return NextResponse.json({ error: "Ya son amigos" }, { status: 400 });
    }
    await prisma.friendship.update({ where: { id: reverse.id }, data: { status: "accepted" } });
    return NextResponse.json({ ok: true, status: "accepted" });
  }

  const friendship = await prisma.friendship
    .create({ data: { requesterId: user.id, addresseeId: target.id } })
    .catch(() => null);
  if (!friendship) {
    return NextResponse.json({ error: "Ya enviaste una solicitud a este usuario" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
