import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FriendActions from "@/components/FriendActions";
import UserSearch from "@/components/UserSearch";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    include: {
      requester: { select: { username: true } },
      addressee: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = rows.filter((f) => f.status === "accepted");
  const incoming = rows.filter((f) => f.status === "pending" && f.addresseeId === user.id);
  const outgoing = rows.filter((f) => f.status === "pending" && f.requesterId === user.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-pixel text-base text-lg">Amigos</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Buscar usuarios</h2>
        <UserSearch />
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-base">Solicitudes recibidas</h2>
          <ul className="flex flex-col gap-2">
            {incoming.map((f) => (
              <li
                key={f.id}
                className="border-base bg-surface flex items-center justify-between rounded-lg border p-3"
              >
                <Link href={`/u/${f.requester.username}`} className="text-base hover-text-accent">
                  {f.requester.username}
                </Link>
                <FriendActions username={f.requester.username} status="incoming" friendshipId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Mis amigos ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-muted text-sm">Todavía no tienes amigos agregados.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {friends.map((f) => {
              const other = f.requesterId === user.id ? f.addressee : f.requester;
              return (
                <li key={f.id}>
                  <Link href={`/u/${other.username}`} className="badge-accent rounded px-2 py-1 text-sm">
                    {other.username}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-base">Solicitudes enviadas</h2>
          <ul className="flex flex-col gap-2">
            {outgoing.map((f) => (
              <li
                key={f.id}
                className="border-base bg-surface flex items-center justify-between rounded-lg border p-3"
              >
                <Link href={`/u/${f.addressee.username}`} className="text-base hover-text-accent">
                  {f.addressee.username}
                </Link>
                <FriendActions username={f.addressee.username} status="outgoing" friendshipId={f.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
