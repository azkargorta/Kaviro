"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 dark:bg-red-950/30 text-4xl">
        ⚠️
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
        Algo ha salido mal
      </h1>
      <p className="mt-3 max-w-sm text-base text-[var(--text-secondary)]">
        Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al dashboard.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-6 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-page)]"
        >
          Mis viajes
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-[var(--text-tertiary)]">
          Error: {error.digest}
        </p>
      )}
    </div>
  );
}
