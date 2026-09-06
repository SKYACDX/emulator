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
      <h1 className="text-2xl font-bold text-base">Algo salió mal</h1>
      <p className="max-w-md text-muted">
        Ocurrió un error inesperado. Puedes intentarlo de nuevo.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <pre className="max-w-lg overflow-auto rounded bg-surface p-3 text-left text-xs text-red-400">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="btn-accent rounded px-4 py-2 font-medium"
      >
        Reintentar
      </button>
    </div>
  );
}
