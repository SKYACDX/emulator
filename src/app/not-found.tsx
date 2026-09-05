import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-neutral-400">
        No encontramos lo que buscabas. Puede que el hack o la plataforma ya
        no exista.
      </p>
      <Link
        href="/"
        className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
