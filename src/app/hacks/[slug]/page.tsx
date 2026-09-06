import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatLabel } from "@/lib/patchFormats";
import AddPatchForm from "@/components/AddPatchForm";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const getHack = cache(async (slug: string) => {
  return prisma.hack.findUnique({
    where: { slug },
    include: {
      game: { include: { platform: true } },
      author: true,
      patches: { orderBy: { createdAt: "desc" } },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hack = await getHack(slug);
  if (!hack) return {};

  const title = `${hack.title} — hack de ${hack.game.title} (${hack.game.platform.name})`;
  const description = hack.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/hacks/${hack.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: hack.game.coverImageUrl ? [hack.game.coverImageUrl] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: hack.game.coverImageUrl ? [hack.game.coverImageUrl] : undefined,
    },
  };
}

export default async function HackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hack = await getHack(slug);

  if (!hack) notFound();

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === hack.authorId;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: hack.title,
    description: hack.description,
    applicationCategory: "GameApplication",
    operatingSystem: hack.game.platform.name,
    datePublished: hack.createdAt.toISOString(),
    author: { "@type": "Person", name: hack.author.username },
    image: hack.game.coverImageUrl ?? undefined,
    about: { "@type": "VideoGame", name: hack.game.title },
  };

  return (
    <div className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          // Escape "<" so a title/description containing "</script>" can't
          // break out of this tag and inject arbitrary script (stored XSS —
          // title/description are attacker-controlled by any hack author).
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex gap-4">
        {hack.game.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hack.game.coverImageUrl}
            alt={hack.game.title}
            className="h-32 w-auto shrink-0 rounded border border-base"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href={`/platforms/${hack.game.platform.slug}`} className="hover:underline">
              {hack.game.platform.name}
            </Link>
            <span>/</span>
            <span>{hack.game.title}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-base">{hack.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Publicado por{" "}
            <Link href={`/u/${hack.author.username}`} className="hover-text-accent">
              {hack.author.username}
            </Link>
          </p>
          <p className="mt-4 whitespace-pre-wrap text-muted">
            {hack.description}
          </p>
        </div>
      </div>

      <AdSlot />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">
          Versiones del parche
        </h2>
        <ul className="flex flex-col gap-3">
          {hack.patches.map((patch) => (
            <li
              key={patch.id}
              className="rounded-lg border border-base bg-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-base">
                  v{patch.version} · {formatLabel(patch.format)}
                </span>
                <a
                  href={`/api/patches/${patch.id}/download`}
                  className="btn-accent rounded px-3 py-1.5 text-sm"
                >
                  Descargar parche ({formatBytes(patch.fileSize)})
                </a>
              </div>
              {patch.releaseNotes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                  {patch.releaseNotes}
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-muted">
                SHA-256: {patch.sha256}
              </p>
              <p className="mt-1 text-xs text-muted">
                {patch.downloadCount} descarga{patch.downloadCount === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-lg border border-base bg-surface p-4 text-sm text-muted">
        Necesitas tu propia copia legal de <strong>{hack.game.title}</strong>{" "}
        para aplicar este parche. Usa la{" "}
        <Link href="/patch" className="text-accent underline">
          herramienta de parcheo
        </Link>{" "}
        para generar la ROM parcheada en tu navegador; el archivo original
        nunca se sube a ningún servidor.
      </div>

      {isOwner && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-base">
            Publicar nueva versión
          </h2>
          <AddPatchForm hackId={hack.id} />
        </section>
      )}
    </div>
  );
}
