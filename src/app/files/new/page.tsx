import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UploadFileForm from "@/components/UploadFileForm";

export default async function NewFilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subir archivo</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          No se permiten videos ni volcados de ROM/ISO (.nds, .gba, .sfc,
          .nsp, .xci, .iso, etc.) — se bloquean automáticamente. Cualquier
          otro tipo de archivo es bienvenido: capturas, guías, savestates,
          assets, etc.
        </p>
      </div>
      <UploadFileForm />
    </div>
  );
}
