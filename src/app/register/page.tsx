import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-base text-lg">Crear cuenta</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
