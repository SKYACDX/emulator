import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ChatWindow from "@/components/ChatWindow";
import GroupMembers from "@/components/GroupMembers";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { participants: { include: { user: { select: { id: true, username: true } } } } },
  });

  const isParticipant = conversation?.participants.some((p) => p.userId === user.id);
  if (!conversation || !isParticipant) notFound();

  const others = conversation.participants.filter((p) => p.userId !== user.id).map((p) => p.user.username);
  const title = conversation.isGroup ? (conversation.name ?? "Grupo") : others[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base">{title}</h1>
        <Link href="/messages" className="text-accent text-sm underline">
          Volver
        </Link>
      </div>

      {conversation.isGroup && (
        <GroupMembers
          conversationId={conversation.id}
          members={conversation.participants.map((p) => p.user.username)}
        />
      )}

      <ChatWindow conversationId={conversation.id} />
    </div>
  );
}
