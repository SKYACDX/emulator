import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/storage";
import LogoutButton from "./LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();
  const avatarUrl = user?.avatarKey ? await getAvatarUrl(user.avatarKey) : null;

  return (
    <header className="border-b-2 border-base bg-page">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-base">
          <svg viewBox="0 0 16 16" className="text-accent h-6 w-6 shrink-0" fill="currentColor">
            <path d="M4 6h1v1H4V6zm7 0h1v1h-1V6zM2 4h12v1H2V4zM1 5h1v6H1V5zm13 0h1v6h-1V5zM2 11h2v1H2v-1zm10 0h2v1h-2v-1zM4 5h1v1H4V5zm0 3h1v1H4V8zm7-3h1v1h-1V5zm0 3h1v1h-1V8zM6 9h1v1H6V9zm3 0h1v1H9V9zM6 6h1v1H6V6zm3 0h1v1H9V6z" />
          </svg>
          <span className="font-pixel text-[11px] leading-none whitespace-nowrap">
            RomHack Hub
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/app" className="hover-text-accent">
            App
          </Link>
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
              <Link href="/messages" className="hover-text-accent">
                Mensajes
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
