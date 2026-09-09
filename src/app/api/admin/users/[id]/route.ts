import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { deletePatchFile, deleteSharedFile } from "@/lib/storage";
import { z } from "zod";

const roleSchema = z.object({ role: z.enum(["USER", "MODERATOR", "ADMIN"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "No puedes cambiar tu propio rol" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  }).catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta desde aquí" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { hacks: { include: { patches: true } }, sharedFiles: true, gameSaves: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  for (const hack of user.hacks) {
    await Promise.all(
      hack.patches.map((patch) => deletePatchFile(patch.storedName).catch(() => {}))
    );
    await prisma.patch.deleteMany({ where: { hackId: hack.id } });
  }
  await prisma.hack.deleteMany({ where: { authorId: user.id } });

  await Promise.all(
    user.sharedFiles.map((file) => deleteSharedFile(file.storedName).catch(() => {}))
  );
  await prisma.fileReport.deleteMany({
    where: {
      OR: [
        { reporterId: user.id },
        { sharedFileId: { in: user.sharedFiles.map((f) => f.id) } },
      ],
    },
  });
  await prisma.sharedFile.deleteMany({ where: { uploaderId: user.id } });

  await Promise.all(
    user.gameSaves.map((save) => deleteSharedFile(save.storedName).catch(() => {}))
  );
  await prisma.gameSave.deleteMany({ where: { userId: user.id } });
  await prisma.apiToken.deleteMany({ where: { userId: user.id } });
  await prisma.communityTheme.deleteMany({ where: { creatorId: user.id } });
  await prisma.emulatorTheme.deleteMany({ where: { authorId: user.id } });
  await prisma.appFeedback.deleteMany({ where: { authorId: user.id } });

  const ownedCommunities = await prisma.community.findMany({ where: { creatorId: user.id } });
  const ownedCommunityIds = ownedCommunities.map((c) => c.id);

  const posts = await prisma.communityPost.findMany({
    where: { OR: [{ authorId: user.id }, { communityId: { in: ownedCommunityIds } }] },
  });
  await Promise.all(posts.filter((p) => p.imageKey).map((p) => deleteSharedFile(p.imageKey!).catch(() => {})));
  await prisma.communityPost.deleteMany({
    where: { OR: [{ authorId: user.id }, { communityId: { in: ownedCommunityIds } }] },
  });

  await prisma.communityMembership.deleteMany({
    where: { OR: [{ userId: user.id }, { communityId: { in: ownedCommunityIds } }] },
  });
  await prisma.community.deleteMany({ where: { creatorId: user.id } });

  await prisma.friendship.deleteMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
  });

  await prisma.message.deleteMany({ where: { senderId: user.id } });
  await prisma.conversationParticipant.deleteMany({ where: { userId: user.id } });

  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
