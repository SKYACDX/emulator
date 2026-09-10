import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createAppFeedbackSchema } from "@/lib/validation";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { getAvatarUrl, headObject } from "@/lib/storage";

const MAX_IMAGE_BYTES = 8_000_000;

export async function GET() {
  const feedback = await prisma.appFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({
    feedback: await Promise.all(
      feedback.map(async (f) => ({
        id: f.id,
        body: f.body,
        deviceInfo: f.deviceInfo,
        appVersion: f.appVersion,
        imageUrl: f.imageKey ? await getAvatarUrl(f.imageKey) : null,
        author: f.author?.username ?? f.guestName ?? "Invitado",
        isGuest: !f.author,
        createdAt: f.createdAt.toISOString(),
      }))
    ),
  });
}

export async function POST(request: Request) {
  // Guests can leave feedback too — no account required, just nudged to
  // create one in the UI. Rate-limited by IP for guests (no user id to key
  // on) and by account for logged-in senders.
  const user = await getUserFromRequest(request);
  const rateLimitKey = user ? `app-feedback:${user.id}` : `app-feedback-guest:${clientIp(request)}`;
  const rateLimit = user ? { limit: 10, windowMs: 60 * 60 * 1000 } : { limit: 5, windowMs: 60 * 60 * 1000 };
  if (!(await checkRateLimit(rateLimitKey, rateLimit.limit, rateLimit.windowMs))) {
    return NextResponse.json({ error: "Demasiados comentarios, espera un rato" }, { status: 429 });
  }

  const parsed = createAppFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  let imageKey: string | null = null;
  if (parsed.data.imageKey) {
    const scope = user ? user.id : "guest";
    if (!parsed.data.imageKey.startsWith(`app-feedback/${scope}/`)) {
      return NextResponse.json({ error: "Imagen no permitida" }, { status: 400 });
    }
    const info = await headObject(parsed.data.imageKey);
    if (!info || info.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Imagen inválida o demasiado grande" }, { status: 400 });
    }
    imageKey = parsed.data.imageKey;
  }

  const feedback = await prisma.appFeedback.create({
    data: {
      body: parsed.data.body,
      deviceInfo: parsed.data.deviceInfo,
      appVersion: parsed.data.appVersion,
      imageKey,
      authorId: user?.id,
      guestName: user ? null : (parsed.data.guestName ?? null),
    },
  });

  return NextResponse.json({ ok: true, id: feedback.id, createdAt: feedback.createdAt.toISOString() });
}
