import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewHackForm from "@/components/NewHackForm";

export default async function NewHackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base">Publicar un hack</h1>
      <p className="max-w-2xl text-sm text-muted">
        Sube solo el archivo de parche (IPS, BPS, UPS o xdelta). Nunca subas la
        ROM completa del juego: eso viola derechos de autor y será eliminado.
      </p>
      <NewHackForm platforms={platforms} />
    </div>
  );
}
