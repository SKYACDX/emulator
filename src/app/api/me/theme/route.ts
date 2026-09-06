import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidThemeId, isValidHexColor, CUSTOM_THEME_ID } from "@/lib/themes";

const hexSchema = z.string().refine(isValidHexColor, "Color inválido");

const schema = z.object({
  theme: z.string().min(1),
  customColors: z
    .object({
      bg: hexSchema,
      surface: hexSchema,
      accent: hexSchema,
      text: hexSchema,
    })
    .optional(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidThemeId(parsed.data.theme)) {
    return NextResponse.json({ error: "Tema inválido" }, { status: 400 });
  }

  const { theme, customColors } = parsed.data;

  if (theme === CUSTOM_THEME_ID && !customColors) {
    return NextResponse.json(
      { error: "Faltan los colores del tema personalizado" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      theme,
      ...(theme === CUSTOM_THEME_ID && customColors
        ? {
            customThemeBg: customColors.bg,
            customThemeSurface: customColors.surface,
            customThemeAccent: customColors.accent,
            customThemeText: customColors.text,
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
