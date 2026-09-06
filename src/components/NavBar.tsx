import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/storage";
import LogoutButton from "./LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();
  const avatarUrl = user?.avatarKey ? await getAvatarUrl(user.avatarKey) : null;

  return (
    <header className="border-b border-base bg-page">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-base">
          RomHack Hub
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/platforms" className="hover-text-accent">
            Plataformas
          </Link>
          <Link href="/patch" className="hover-text-accent">
            Aplicar parche
          </Link>
          <Link href="/files" className="hover-text-accent">
            Juegos
          </Link>
          <Link href="/themes" className="hover-text-accent">
            Temas
          </Link>
          <Link href="/communities" className="hover-text-accent">
            Comunidades
          </Link>
          {user ? (
            <>
              <Link href="/hacks/new" className="text-accent hover:opacity-80">
                Publicar hack
              </Link>
              <Link href="/me" className="text-muted hover-text-accent flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl ?? "/default-avatar.svg"}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
                {user.username}
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300">
                  Admin
                </Link>
              )}
              {user.role === "MODERATOR" && (
                <Link href="/moderation" className="text-amber-400 hover:text-amber-300">
                  Moderación
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover-text-accent">
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-accent rounded px-3 py-1.5">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
