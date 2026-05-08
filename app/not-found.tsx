import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--brand-light)] text-4xl">
        🗺️
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-sm text-base text-[var(--text-secondary)]">
        Esta página no existe o el viaje que buscas ha sido eliminado.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Mis viajes
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-6 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-page)]"
        >
          Inicio
        </Link>
      </div>
    </div>
  );
}
