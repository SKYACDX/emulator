import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ThemeGallery from "@/components/ThemeGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galería de temas",
  description: "Temas visuales creados por la comunidad de RomHack Hub.",
  alternates: { canonical: "/themes" },
};

export default async function ThemesPage() {
  const currentUser = await getCurrentUser();

  const themes = await prisma.communityTheme.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { creator: { select: { username: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-base">Galería de temas</h1>
        <p className="text-muted mt-1 max-w-2xl text-sm">
          Temas creados por la comunidad. Haz clic en uno para verlo aplicado
          al instante (sin guardar nada), y en "Usar este tema" para
          adoptarlo como tu tema personalizado — queda tan editable como
          quieras desde tu perfil.
        </p>
      </div>

      <ThemeGallery
        currentUserId={currentUser?.id ?? null}
        isAdmin={currentUser?.role === "ADMIN"}
        themes={themes.map((t) => ({
          id: t.id,
          name: t.name,
          bg: t.bg,
          surface: t.surface,
          accent: t.accent,
          text: t.text,
          creator: t.creator.username,
          creatorId: t.creatorId,
        }))}
      />
    </div>
  );
}
