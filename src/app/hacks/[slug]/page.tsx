import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatLabel } from "@/lib/patchFormats";
import AddPatchForm from "@/components/AddPatchForm";

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex gap-4">
        {hack.game.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hack.game.coverImageUrl}
            alt={hack.game.title}
            className="h-32 w-auto shrink-0 rounded border border-neutral-800"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href={`/platforms/${hack.game.platform.slug}`} className="hover:underline">
              {hack.game.platform.name}
            </Link>
            <span>/</span>
            <span>{hack.game.title}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">{hack.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Publicado por {hack.author.username}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-neutral-300">
            {hack.description}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Versiones del parche
        </h2>
        <ul className="flex flex-col gap-3">
          {hack.patches.map((patch) => (
            <li
              key={patch.id}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white">
                  v{patch.version} · {formatLabel(patch.format)}
                </span>
                <a
                  href={`/api/patches/${patch.id}/download`}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
                >
                  Descargar parche ({formatBytes(patch.fileSize)})
                </a>
              </div>
              {patch.releaseNotes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-400">
                  {patch.releaseNotes}
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-neutral-600">
                SHA-256: {patch.sha256}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
        Necesitas tu propia copia legal de <strong>{hack.game.title}</strong>{" "}
        para aplicar este parche. Usa la{" "}
        <Link href="/patch" className="text-emerald-400 underline">
          herramienta de parcheo
        </Link>{" "}
        para generar la ROM parcheada en tu navegador; el archivo original
        nunca se sube a ningún servidor.
      </div>

      {isOwner && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Publicar nueva versión
          </h2>
          <AddPatchForm hackId={hack.id} />
        </section>
      )}
    </div>
  );
}
