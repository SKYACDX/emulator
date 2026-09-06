import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminHacksTable from "@/components/AdminHacksTable";
import AdminUsersTable from "@/components/AdminUsersTable";
import AdminReportsTable from "@/components/AdminReportsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const [hacks, users, sharedFileCount, reportedFiles] = await Promise.all([
    prisma.hack.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        game: { include: { platform: true } },
        author: { select: { username: true } },
        patches: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { hacks: true } },
      },
    }),
    prisma.sharedFile.count(),
    prisma.sharedFile.findMany({
      where: { reports: { some: {} } },
      include: {
        uploader: { select: { username: true } },
        reports: {
          orderBy: { createdAt: "desc" },
          include: { reporter: { select: { username: true } } },
        },
      },
      orderBy: { reports: { _count: "desc" } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-base">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted">
          Sesión: {admin.username} ({admin.email})
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">
          Hacks publicados ({hacks.length})
        </h2>
        <AdminHacksTable
          hacks={hacks.map((h) => ({
            id: h.id,
            title: h.title,
            slug: h.slug,
            author: h.author.username,
            platform: h.game.platform.name,
            game: h.game.title,
            patchCount: h.patches.length,
            createdAt: h.createdAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">
          Archivos reportados ({reportedFiles.length})
        </h2>
        <AdminReportsTable
          files={reportedFiles.map((f) => ({
            id: f.id,
            title: f.title,
            uploader: f.uploader.username,
            reports: f.reports.map((r) => ({
              id: r.id,
              reason: r.reason,
              reporter: r.reporter.username,
              createdAt: r.createdAt.toISOString(),
            })),
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">
          Archivos compartidos ({sharedFileCount})
        </h2>
        <p className="text-sm text-muted">
          Modéralos desde{" "}
          <Link href="/files" className="text-accent underline">
            /files
          </Link>
          : como admin puedes eliminar cualquier archivo de cualquier usuario
          directamente desde esa página.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-base">
          Usuarios ({users.length})
        </h2>
        <AdminUsersTable
          currentAdminId={admin.id}
          users={users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            hackCount: u._count.hacks,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
