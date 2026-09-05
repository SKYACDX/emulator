"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
      <p className="max-w-md text-neutral-400">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <pre className="max-w-lg overflow-auto rounded bg-neutral-900 p-3 text-left text-xs text-red-400">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
      >
        Reintentar
      </button>
    </div>
  );
}
