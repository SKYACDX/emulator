import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-neutral-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-emerald-400 underline">
          Crea una
        </Link>
      </p>
    </div>
  );
}
