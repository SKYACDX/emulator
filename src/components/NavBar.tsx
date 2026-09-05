import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-neutral-100">
          RomHack Hub
        </Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          <Link href="/platforms" className="hover:text-white">
            Plataformas
          </Link>
          <Link href="/patch" className="hover:text-white">
            Aplicar parche
          </Link>
          <Link href="/files" className="hover:text-white">
            Archivos
          </Link>
          {user ? (
            <>
              <Link href="/hacks/new" className="hover:text-white">
                Publicar hack
              </Link>
              <Link href="/me" className="text-neutral-400 hover:text-white">
                {user.username}
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300">
                  Admin
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
