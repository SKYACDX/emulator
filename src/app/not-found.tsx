import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-base">404</h1>
      <p className="text-muted">
        No encontramos lo que buscabas. Puede que el hack o la plataforma ya
        no exista.
      </p>
      <Link
        href="/"
        className="btn-accent rounded px-4 py-2 font-medium"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
