import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createHackSchema } from "@/lib/validation";
import { formatFromFilename, ALLOWED_PATCH_EXTENSIONS } from "@/lib/patchFormats";
import { savePatchFile, maxPatchSizeBytes } from "@/lib/storage";
import { slugify, uniqueSlug } from "@/lib/slug";
import { isAllowedCoverUrl } from "@/lib/thegamesdb";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!(await checkRateLimit(`hacks-create:${user.id}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas publicaciones, espera un rato" }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const parsed = createHackSchema.safeParse({
    platformSlug: formData.get("platformSlug"),
    gameTitle: formData.get("gameTitle"),
    hackTitle: formData.get("hackTitle"),
    description: formData.get("description"),
    version: formData.get("version"),
    releaseNotes: formData.get("releaseNotes") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const file = formData.get("patchFile");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Debes adjuntar un archivo de parche" }, { status: 400 });
  }
  if (file.size > maxPatchSizeBytes()) {
    return NextResponse.json({ error: "El archivo de parche es demasiado grande" }, { status: 400 });
  }
  const format = formatFromFilename(file.name);
  if (!format) {
    return NextResponse.json(
      { error: `Formato no soportado. Usa: ${ALLOWED_PATCH_EXTENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const { platformSlug, gameTitle, hackTitle, description, version, releaseNotes } = parsed.data;

  const platform = await prisma.platform.findUnique({ where: { slug: platformSlug } });
  if (!platform) {
    return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
  }

  const rawCoverImageUrl = formData.get("coverImageUrl");
  const coverImageUrl =
    typeof rawCoverImageUrl === "string" && isAllowedCoverUrl(rawCoverImageUrl)
      ? rawCoverImageUrl
      : null;

  const gameSlugBase = `${platformSlug}-${slugify(gameTitle)}`;
  let game = await prisma.game.findFirst({
    where: { platformId: platform.id, title: { equals: gameTitle } },
  });
  if (!game) {
    game = await prisma.game.create({
      data: {
        title: gameTitle,
        platformId: platform.id,
        coverImageUrl,
        slug: (await prisma.game.findUnique({ where: { slug: gameSlugBase } }))
          ? uniqueSlug(gameSlugBase)
          : gameSlugBase,
      },
    });
  } else if (!game.coverImageUrl && coverImageUrl) {
    game = await prisma.game.update({
      where: { id: game.id },
      data: { coverImageUrl },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storedName, sha256 } = await savePatchFile(buffer, file.name);

  const hackSlugBase = slugify(hackTitle);
  const hackSlugExists = await prisma.hack.findUnique({ where: { slug: hackSlugBase } });

  const hack = await prisma.hack.create({
    data: {
      title: hackTitle,
      slug: hackSlugExists ? uniqueSlug(hackSlugBase) : hackSlugBase,
      description,
      gameId: game.id,
      authorId: user.id,
      patches: {
        create: {
          version,
          format,
          originalName: file.name,
          storedName,
          fileSize: file.size,
          sha256,
          releaseNotes,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, slug: hack.slug });
}
