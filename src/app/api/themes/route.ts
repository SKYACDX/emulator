import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { createEmulatorThemeSchema } from "@/lib/validation";
import { serializeEmulatorTheme } from "@/lib/emulatorThemes";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!(await checkRateLimit(`theme-create:${user.id}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados temas, espera un rato" }, { status: 429 });
  }

  const parsed = createEmulatorThemeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { slug, name, system, palette, presets, public: isPublic } = parsed.data;

  const platform = await prisma.platform.findUnique({ where: { slug: system } });
  if (!platform) {
    return NextResponse.json({ error: "Sistema inválido" }, { status: 400 });
  }

  const theme = await prisma.emulatorTheme
    .create({
      data: {
        slug,
        name,
        system,
        isPublic,
        authorId: user.id,
        shellBackground: palette.shellBackground,
        shellBorder: palette.shellBorder,
        screenBezel: palette.screenBezel,
        dpadColor: palette.dpadColor,
        actionButtonColor: palette.actionButtonColor,
        shoulderButtonColor: palette.shoulderButtonColor,
        dpadPreset: presets.dpad,
        actionButtonsPreset: presets.actionButtons,
        shoulderButtonsPreset: presets.shoulderButtons,
      },
      include: { author: { select: { username: true } } },
    })
    .catch(() => null);

  if (!theme) {
    return NextResponse.json({ error: "Ya existe un tema con ese slug" }, { status: 409 });
  }

  return NextResponse.json({ theme: serializeEmulatorTheme(theme) }, { status: 201 });
}
