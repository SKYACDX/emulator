import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import TotpSettings from "@/components/TotpSettings";
import LinkedDevices from "@/components/LinkedDevices";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-base">Seguridad de la cuenta</h1>
      <TotpSettings initialEnabled={user.totpEnabled} />

      <section>
        <h2 className="text-base mb-3 text-lg font-semibold">Dispositivos vinculados</h2>
        <p className="text-muted mb-3 text-sm">
          Apps del emulador que iniciaron sesión con tu cuenta para guardar
          tus partidas en la nube. Desvincula cualquiera que ya no reconozcas
          o que hayas perdido.
        </p>
        <LinkedDevices />
      </section>
    </div>
  );
}
