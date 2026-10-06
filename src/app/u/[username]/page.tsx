import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import FriendActions from "@/components/FriendActions";

export const dynamic = "force-dynamic";

async function getProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarKey: true,
      createdAt: true,
      hacks: {
        include: { game: { include: { platform: true } } },
        orderBy: { createdAt: "desc" },
      },
      sharedFiles: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
      gameSaves: {
        select: { gameKey: true, title: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  return user;
}

// One entry per game (a game has several saves: slots, states). Its name is
// the newest save's that has one; games with no name yet are only counted.
function summarizeSavedGames(saves: { gameKey: string; title: string | null }[]) {
  const titleByKey = new Map<string, string | null>();
  for (const save of saves) {
    if (!titleByKey.get(save.gameKey)) titleByKey.set(save.gameKey, save.title);
  }
  const titles = [...new Set([...titleByKey.values()].filter((t): t is string => Boolean(t)))].sort(
    (a, b) => a.localeCompare(b, "es")
  );
  const unnamed = [...titleByKey.values()].filter((t) => !t).length;
  return { count: titleByKey.size, titles, unnamed };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getProfile(username);
  if (!user) return {};
  return { title: `Perfil de ${user.username}` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getProfile(username);
  if (!user) notFound();

  const avatarUrl = user.avatarKey ? await getAvatarUrl(user.avatarKey) : null;
  const savedGames = summarizeSavedGames(user.gameSaves);

  const viewer = await getCurrentUser();
  let friendStatus: "none" | "friends" | "incoming" | "outgoing" = "none";
  let friendshipId: string | null = null;
  if (viewer && viewer.id !== user.id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewer.id, addresseeId: user.id },
          { requesterId: user.id, addresseeId: viewer.id },
        ],
      },
    });
    if (friendship) {
      friendshipId = friendship.id;
      friendStatus =
        friendship.status === "accepted"
          ? "friends"
          : friendship.requesterId === viewer.id
            ? "outgoing"
            : "incoming";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl ?? "/default-avatar.svg"}
          alt={user.username}
          className="border-accent glow-accent h-20 w-20 rounded-full border-2 object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-base">{user.username}</h1>
          <p className="text-muted text-sm">
            Miembro desde {user.createdAt.toLocaleDateString("es")}
          </p>
        </div>
        {viewer && viewer.id !== user.id && (
          <div className="ml-auto">
            <FriendActions username={user.username} status={friendStatus} friendshipId={friendshipId} />
          </div>
        )}
      </div>

      {/* Never the keys: one can be built from the ROM's file name (e.g.
          Android's DS keys). Only the names the apps read from the ROMs
          themselves, and a count for games that have none yet. */}
      {savedGames.count > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-base">
            Juegos con partida guardada ({savedGames.count})
          </h2>
          {savedGames.titles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedGames.titles.map((title) => (
                <span key={title} className="badge-accent rounded px-2 py-1 text-sm">
                  {title}
                </span>
              ))}
            </div>
          )}
          {savedGames.unnamed > 0 && (
            <p className="text-muted mt-2 text-sm">
              {savedGames.titles.length > 0 ? "y " : ""}
              {savedGames.unnamed} {savedGames.unnamed === 1 ? "juego" : "juegos"}
              {savedGames.titles.length > 0 ? " más" : ""}
              {savedGames.titles.length > 0 ? "." : " sin nombre todavía."}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">
          Hacks publicados ({user.hacks.length})
        </h2>
        {user.hacks.length === 0 ? (
          <p className="text-muted text-sm">Todavía no ha publicado ningún hack.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {user.hacks.map((hack) => (
              <li key={hack.id}>
                <Link href={`/hacks/${hack.slug}`} className="game-card block p-3">
                  <span className="text-base">{hack.title}</span>
                  <span className="text-muted ml-2 text-xs">
                    {hack.game.title} · {hack.game.platform.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">
          Archivos compartidos ({user.sharedFiles.length})
        </h2>
        {user.sharedFiles.length === 0 ? (
          <p className="text-muted text-sm">Todavía no ha compartido ningún archivo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {user.sharedFiles.map((file) => (
              <li key={file.id} className="game-card flex items-center justify-between p-3">
                <span className="text-base">{file.title}</span>
                <a
                  href={`/api/files/${file.id}/download`}
                  className="btn-accent rounded px-3 py-1 text-sm"
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
