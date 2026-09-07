import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearerToken } from "@/lib/apiAuth";
import { updateEmulatorThemeSchema } from "@/lib/validation";
import { serializeEmulatorTheme } from "@/lib/emulatorThemes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.emulatorTheme.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
  }
  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = updateEmulatorThemeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, palette, presets, public: isPublic } = parsed.data;

  const theme = await prisma.emulatorTheme.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(isPublic !== undefined && { isPublic }),
      ...(palette && {
        shellBackground: palette.shellBackground,
        shellBorder: palette.shellBorder,
        screenBezel: palette.screenBezel,
        dpadColor: palette.dpadColor,
        actionButtonColor: palette.actionButtonColor,
        shoulderButtonColor: palette.shoulderButtonColor,
      }),
      ...(presets && {
        dpadPreset: presets.dpad,
        actionButtonsPreset: presets.actionButtons,
        shoulderButtonsPreset: presets.shoulderButtons,
      }),
    },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ theme: serializeEmulatorTheme(theme) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromBearerToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.emulatorTheme.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
  }
  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.emulatorTheme.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
