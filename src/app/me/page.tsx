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

  const hacks = await prisma.hack.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      game: { include: { platform: true } },
      patches: { select: { id: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base">Mis hacks</h1>
        <div className="flex gap-2">
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
