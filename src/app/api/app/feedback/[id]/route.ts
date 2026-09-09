import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const { id } = await params;
  const feedback = await prisma.appFeedback.findUnique({ where: { id } });
  if (!feedback) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (feedback.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.appFeedback.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
