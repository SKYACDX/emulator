import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAppFeedbackSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const feedback = await prisma.appFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      body: f.body,
      author: f.author.username,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!(await checkRateLimit(`app-feedback:${user.id}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados comentarios, espera un rato" }, { status: 429 });
  }

  const parsed = createAppFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const feedback = await prisma.appFeedback.create({
    data: { body: parsed.data.body, authorId: user.id },
  });

  return NextResponse.json({ ok: true, id: feedback.id, createdAt: feedback.createdAt.toISOString() });
}
