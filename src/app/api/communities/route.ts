import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify, uniqueSlug } from "@/lib/slug";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
  return NextResponse.json({
    communities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      memberCount: c._count.members,
    })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  description: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  if (!(await checkRateLimit(`community-create:${user.id}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas comunidades, espera un rato" }, { status: 429 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const base = slugify(parsed.data.name);
  const exists = await prisma.community.findUnique({ where: { slug: base } });
  const slug = exists ? uniqueSlug(base) : base;

  const community = await prisma.community
    .create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        slug,
        creatorId: user.id,
        members: { create: { userId: user.id, role: "owner" } },
      },
    })
    .catch(() => null);

  if (!community) {
    return NextResponse.json({ error: "Ya existe una comunidad con ese nombre" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, slug: community.slug });
}
