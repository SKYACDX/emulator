import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TotpSettings from "@/components/TotpSettings";
import LinkedDevices from "@/components/LinkedDevices";
import PasskeyManager from "@/components/PasskeyManager";

export const dynamic = "force-dynamic";

const METHOD_LABELS: Record<string, string> = {
  password: "Contraseña",
  totp: "Código de verificación",
  passkey: "Passkey",
  "app-token": "App (login)",
};

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = await prisma.loginAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-base">Seguridad de la cuenta</h1>
      <TotpSettings initialEnabled={user.totpEnabled} />

      <section>
        <h2 className="text-base mb-3 text-lg font-semibold">Passkeys</h2>
        <PasskeyManager />
      </section>

      <section>
        <h2 className="text-base mb-3 text-lg font-semibold">Dispositivos vinculados</h2>
        <p className="text-muted mb-3 text-sm">
          Apps del emulador que iniciaron sesión con tu cuenta para guardar
          tus partidas en la nube. Desvincula cualquiera que ya no reconozcas
          o que hayas perdido.
        </p>
        <LinkedDevices />
      </section>

      <section>
        <h2 className="text-base mb-3 text-lg font-semibold">Actividad reciente de inicio de sesión</h2>
        <p className="text-muted mb-3 text-sm">
          Los últimos {attempts.length} intentos contra tu cuenta, exitosos o
          no. Si ves algo que no reconoces, cambia tu contraseña.
        </p>
        {attempts.length === 0 ? (
          <p className="text-muted text-sm">Sin actividad registrada todavía.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="border-base bg-surface flex items-center justify-between rounded border p-2 text-sm"
              >
                <span className={a.success ? "text-base" : "text-red-400"}>
                  {a.success ? "✓" : "✗"} {METHOD_LABELS[a.method] ?? a.method}
                </span>
                <span className="text-muted text-xs">
                  {a.ip} · {new Date(a.createdAt).toLocaleString("es")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
