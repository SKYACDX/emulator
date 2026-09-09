import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeAppListing, serializeAppRelease } from "@/lib/appListing";
import { getCurrentUser } from "@/lib/auth";
import AppDescription from "@/components/AppDescription";
import AppFeedback from "@/components/AppFeedback";

export const dynamic = "force-dynamic";

async function getData() {
  const listing = await prisma.appListing.findFirst({ include: { screenshots: true } });
  if (!listing) return null;

  const latestRelease = await prisma.appRelease.findFirst({
    where: { listingId: listing.id },
    orderBy: { versionCode: "desc" },
  });

  return {
    listing: await serializeAppListing(listing),
    latestRelease: latestRelease ? await serializeAppRelease(latestRelease) : null,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  if (!data) return {};
  return {
    title: data.listing.name,
    description: data.listing.tagline,
    alternates: { canonical: "/app" },
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AppPage() {
  const data = await getData();
  if (!data) notFound();
  const { listing, latestRelease } = data;

  const [user, feedback] = await Promise.all([
    getCurrentUser(),
    prisma.appFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { author: { select: { username: true, id: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        {listing.iconUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.iconUrl}
            alt={listing.name}
            className="border-base h-20 w-20 shrink-0 rounded-2xl border object-cover"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-base">{listing.name}</h1>
          <p className="text-muted mt-1">{listing.tagline}</p>
        </div>
      </div>

      {latestRelease && (
        <div className="border-base bg-surface flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div>
            <p className="text-base font-medium">
              Versión {latestRelease.version} · requiere Android API {latestRelease.minAndroidSdk}+
            </p>
            <p className="text-muted text-sm">
              {formatBytes(latestRelease.apkSize)} · {latestRelease.downloads} descarga
              {latestRelease.downloads === 1 ? "" : "s"}
            </p>
          </div>
          <a
            href={`/api/app/releases/${latestRelease.id}/download`}
            className="btn-accent rounded px-5 py-2.5 text-sm font-medium"
          >
            Descargar APK
          </a>
        </div>
      )}

      {listing.screenshots.length > 0 && (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {listing.screenshots.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Captura ${i + 1}`}
              className="border-base h-64 w-auto shrink-0 rounded-lg border object-cover"
            />
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">Funcionalidades</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listing.features.map((feature, i) => (
            <li key={i} className="border-base bg-surface rounded-lg border p-3 text-sm text-base">
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">Acerca de</h2>
        <AppDescription text={listing.description} />
      </section>

      {latestRelease?.changelog && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-base">
            Novedades de la versión {latestRelease.version}
          </h2>
          <p className="text-muted whitespace-pre-wrap text-sm">{latestRelease.changelog}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">Comentarios y retroalimentación</h2>
        <AppFeedback
          isLoggedIn={!!user}
          feedback={feedback.map((f) => ({
            id: f.id,
            body: f.body,
            author: f.author.username,
            createdAt: f.createdAt.toISOString(),
            canDelete: !!user && (user.id === f.author.id || user.role === "ADMIN"),
          }))}
        />
      </section>
    </div>
  );
}
