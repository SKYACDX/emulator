import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import TotpSettings from "@/components/TotpSettings";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-base">Seguridad de la cuenta</h1>
      <TotpSettings initialEnabled={user.totpEnabled} />
    </div>
  );
}
