import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeAppListing, serializeAppRelease } from "@/lib/appListing";
import { getCurrentUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/storage";
import AppDescription from "@/components/AppDescription";
import AppFeedback from "@/components/AppFeedback";
import AppDownloadTabs from "@/components/AppDownloadTabs";

export const dynamic = "force-dynamic";

async function getData() {
  const listing = await prisma.appListing.findFirst({ include: { screenshots: true } });
  if (!listing) return null;

  const [latestAndroid, latestWindows] = await Promise.all([
    prisma.appRelease.findFirst({
      where: { listingId: listing.id, platform: "ANDROID" },
      orderBy: { versionCode: "desc" },
    }),
    prisma.appRelease.findFirst({
      where: { listingId: listing.id, platform: "WINDOWS" },
      orderBy: { versionCode: "desc" },
    }),
  ]);

  return {
    listing: await serializeAppListing(listing),
    releases: {
      ANDROID: latestAndroid ? await serializeAppRelease(latestAndroid) : null,
      WINDOWS: latestWindows ? await serializeAppRelease(latestWindows) : null,
    },
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

export default async function AppPage() {
  const data = await getData();
  if (!data) notFound();
  const { listing, releases } = data;

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
            className="border-accent glow-accent h-20 w-20 shrink-0 rounded-2xl border-2 object-cover"
          />
        )}
        <div className="min-w-0">
          <h1 className="font-pixel text-base text-xl">{listing.name}</h1>
          <p className="text-muted mt-2">{listing.tagline}</p>
        </div>
      </div>

      <AppDownloadTabs releases={releases} />

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
        <h2 className="font-pixel mb-4 text-[13px] tracking-wide text-base">Funcionalidades</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listing.features.map((feature, i) => (
            <li key={i} className="game-card p-3 text-sm text-base">
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-pixel mb-3 text-[13px] tracking-wide text-base">Acerca de</h2>
        <AppDescription text={listing.description} />
      </section>

      <section>
        <h2 className="font-pixel mb-3 text-[13px] tracking-wide text-base">Comentarios y retroalimentación</h2>
        <AppFeedback
          isLoggedIn={!!user}
          feedback={await Promise.all(
            feedback.map(async (f) => ({
              id: f.id,
              body: f.body,
              deviceInfo: f.deviceInfo,
              appVersion: f.appVersion,
              imageUrl: f.imageKey ? await getAvatarUrl(f.imageKey) : null,
              author: f.author?.username ?? f.guestName ?? "Invitado",
              createdAt: f.createdAt.toISOString(),
              canDelete: !!user && (user.id === f.author?.id || user.role === "ADMIN"),
            }))
          )}
        />
      </section>
    </div>
  );
}
