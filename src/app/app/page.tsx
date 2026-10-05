import type { Metadata } from "next";
import Link from "next/link";
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

      <AppDownloadTabs releases={releases} screenshots={listing.screenshotsByPlatform} />

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
        <h2 className="font-pixel mb-3 text-[13px] tracking-wide text-base">
          Código abierto y licencia
        </h2>
        <div className="text-muted flex flex-col gap-2 text-sm">
          <p>
            multiemu es software libre, publicado bajo la licencia{" "}
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              GPL-3.0-or-later
            </a>
            . Puedes leer, modificar y redistribuir el código fuente de la
            versión que descargues:
          </p>
          <ul className="list-disc pl-5">
            <li>
              Windows:{" "}
              <a
                href="https://github.com/SKYACDX/multiemu_exe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                github.com/SKYACDX/multiemu_exe
              </a>
            </li>
            <li>
              Android:{" "}
              <a
                href="https://github.com/SKYACDX/multiemu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                github.com/SKYACDX/multiemu
              </a>
            </li>
          </ul>
          <p>
            Incluye componentes de terceros con sus propias licencias (melonDS,
            mGBA, Azahar, Electron y React Native); el detalle está en el
            archivo <code>THIRD_PARTY_NOTICES.md</code> de cada repositorio.
          </p>
          <p>
            El instalador de Windows se firma con un certificado gratuito de
            SignPath Foundation. Lee la{" "}
            <Link href="/code-signing-policy" className="text-accent underline">
              política de firma de código
            </Link>{" "}
            para saber qué se firma y qué datos envía la app por red.
          </p>
        </div>
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
