import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/storage";
import CommunityActions from "@/components/CommunityActions";
import CommunityFeed from "@/components/CommunityFeed";

export const dynamic = "force-dynamic";

async function getCommunity(slug: string) {
  return prisma.community.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { username: true } } }, orderBy: { joinedAt: "asc" } },
      posts: {
        include: { author: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return {};
  return { title: community.name, description: community.description };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const user = await getCurrentUser();
  const membership = user ? community.members.find((m) => m.userId === user.id) : undefined;

  const posts = await Promise.all(
    community.posts.map(async (post) => ({
      id: post.id,
      body: post.body,
      imageUrl: post.imageKey ? await getAvatarUrl(post.imageKey) : null,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      canDelete: !!user && (user.id === post.authorId || user.id === community.creatorId || user.role === "ADMIN"),
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-base">{community.name}</h1>
        {community.description && <p className="text-muted mt-1">{community.description}</p>}
      </div>

      <CommunityActions
        slug={community.slug}
        isLoggedIn={!!user}
        isMember={!!membership}
        isOwner={membership?.role === "owner"}
      />

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">
          Miembros ({community.members.length})
        </h2>
        <ul className="flex flex-wrap gap-2">
          {community.members.map((m) => (
            <li key={m.id}>
              <Link
                href={`/u/${m.user.username}`}
                className="badge-accent rounded px-2 py-1 text-sm"
              >
                {m.user.username}
                {m.role === "owner" && " 👑"}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Publicaciones</h2>
        <CommunityFeed slug={community.slug} isMember={!!membership} posts={posts} />
      </section>
    </div>
  );
}
