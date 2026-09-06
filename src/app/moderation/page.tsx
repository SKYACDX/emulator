import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminReportsTable from "@/components/AdminReportsTable";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/");

  const reportedFiles = await prisma.sharedFile.findMany({
    where: { reports: { some: {} } },
    include: {
      uploader: { select: { username: true } },
      reports: {
        orderBy: { createdAt: "desc" },
        include: { reporter: { select: { username: true } } },
      },
    },
    orderBy: { reports: { _count: "desc" } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Moderación</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Sesión: {staff.username} — revisa y actúa sobre archivos reportados
          por la comunidad.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
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
    </div>
  );
}
