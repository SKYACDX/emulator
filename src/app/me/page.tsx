import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ThemePicker from "@/components/ThemePicker";
import AvatarUpload from "@/components/AvatarUpload";
import { DEFAULT_CUSTOM_COLORS } from "@/lib/themes";
import { getAvatarUrl } from "@/lib/storage";

export default async function MyHacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const avatarUrl = user.avatarKey ? await getAvatarUrl(user.avatarKey) : null;

  const [hacks, saves] = await Promise.all([
    prisma.hack.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        game: { include: { platform: true } },
        patches: { select: { id: true } },
      },
    }),
    // Private: the public profile only shows how many games, since a key can
    // carry the ROM's file name.
    prisma.gameSave.groupBy({
      by: ["gameKey"],
      where: { userId: user.id },
      _count: { _all: true },
      _max: { updatedAt: true },
      orderBy: { _max: { updatedAt: "desc" } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-base text-lg">Mis hacks</h1>
        <div className="flex gap-2">
          <Link
            href="/me/friends"
            className="rounded bg-surface px-4 py-2 text-sm text-base hover-surface"
          >
            Amigos
          </Link>
          <Link
            href="/me/security"
            className="rounded bg-surface px-4 py-2 text-sm text-base hover-surface"
          >
            Seguridad
          </Link>
          <Link
            href="/hacks/new"
            className="btn-accent rounded px-4 py-2 text-sm font-medium"
          >
            Publicar nuevo hack
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">Foto de perfil</h2>
        <AvatarUpload initialUrl={avatarUrl} />
        <Link href={`/u/${user.username}`} className="text-accent mt-2 inline-block text-sm underline">
          Ver mi perfil público
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">Tema</h2>
        <ThemePicker
          currentTheme={user.theme}
          initialCustomColors={{
            bg: user.customThemeBg ?? DEFAULT_CUSTOM_COLORS.bg,
            surface: user.customThemeSurface ?? DEFAULT_CUSTOM_COLORS.surface,
            accent: user.customThemeAccent ?? DEFAULT_CUSTOM_COLORS.accent,
            text: user.customThemeText ?? DEFAULT_CUSTOM_COLORS.text,
          }}
        />
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-base">
          Partidas en la nube ({saves.length} {saves.length === 1 ? "juego" : "juegos"})
        </h2>
        <p className="text-muted mb-3 text-sm">
          Solo tú ves esta lista; tu perfil público muestra únicamente cuántos
          juegos son. Se gestionan desde la app del emulador.
        </p>
        {saves.length === 0 ? (
          <p className="text-muted text-sm">Todavía no has subido ninguna partida.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {saves.map((save) => (
              <li
                key={save.gameKey}
                className="border-base bg-surface flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm"
              >
                <code className="text-base break-all">{save.gameKey}</code>
                <span className="text-muted text-xs">
                  {save._count._all} {save._count._all === 1 ? "archivo" : "archivos"}
                  {save._max.updatedAt &&
                    ` · actualizado el ${save._max.updatedAt.toLocaleDateString("es")}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {hacks.length === 0 ? (
        <p className="text-muted">
          Todavía no has publicado ningún hack.{" "}
          <Link href="/hacks/new" className="text-accent underline">
            Publica el primero
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {hacks.map((hack) => (
            <li key={hack.id}>
              <Link
                href={`/hacks/${hack.slug}`}
                className="block rounded-lg border border-base bg-surface p-4 hover-border"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium text-base">{hack.title}</h2>
                  <span className="rounded bg-surface px-2 py-0.5 text-xs text-muted">
                    {hack.game.platform.name}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {hack.game.title} · {hack.patches.length} versión(es)
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
