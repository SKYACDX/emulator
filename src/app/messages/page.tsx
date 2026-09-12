import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewConversationForm from "@/components/NewConversationForm";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [conversations, friendships] = await Promise.all([
    prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      include: {
        participants: { include: { user: { select: { username: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.friendship.findMany({
      where: { status: "accepted", OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
      include: {
        requester: { select: { username: true } },
        addressee: { select: { username: true } },
      },
    }),
  ]);

  const friends = friendships.map((f) => (f.requesterId === user.id ? f.addressee : f.requester));

  const rows = conversations
    .map((c) => {
      const mine = c.participants.find((p) => p.userId === user.id)!;
      const others = c.participants.filter((p) => p.userId !== user.id).map((p) => p.user.username);
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        label: c.isGroup ? (c.name ?? "Grupo") : (others[0] ?? "?"),
        preview: lastMessage?.body ?? "Sin mensajes todavía",
        at: lastMessage?.createdAt ?? c.createdAt,
        unread: lastMessage ? lastMessage.createdAt > mine.lastReadAt : false,
      };
    })
    .sort((a, b) => +b.at - +a.at);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base text-lg">Mensajes</h1>

      <NewConversationForm friends={friends} />

      {rows.length === 0 ? (
        <p className="text-muted text-sm">Todavía no tienes conversaciones.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/messages/${row.id}`}
                className="border-base bg-surface hover-border flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium">
                    {row.label} {row.unread && <span className="text-accent">●</span>}
                  </p>
                  <p className="text-muted truncate text-sm">{row.preview}</p>
                </div>
                <span className="text-muted shrink-0 text-xs">
                  {new Date(row.at).toLocaleDateString("es")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
