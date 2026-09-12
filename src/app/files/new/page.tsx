import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UploadFileForm from "@/components/UploadFileForm";

export default async function NewFilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-pixel text-base text-lg">Subir archivo</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          No se permiten videos, ejecutables/scripts (.exe, .apk, .sh, etc.)
          ni volcados de ROM/ISO (.nds, .gba, .sfc, .nsp, .xci, .iso, etc.)
          — se bloquean automáticamente. Además, cada archivo se revisa con
          VirusTotal antes de aceptarse. Cualquier otro tipo de archivo es
          bienvenido: capturas, guías, savestates, assets, etc.
        </p>
      </div>
      <UploadFileForm platforms={platforms} />
    </div>
  );
}
