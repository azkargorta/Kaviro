import type { ReactNode } from "react";
import Link from "next/link";
import KaviroLogo from "@/components/brand/KaviroLogo";
import { APP_NAME } from "@/lib/brand";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-dvh min-w-0 bg-[var(--surface-page)]">
      <div className="mx-auto flex min-h-dvh max-w-7xl items-start justify-center px-safe-inline pb-6 pt-[max(1.5rem,var(--safe-area-top))] sm:pb-8 sm:pt-[max(2rem,var(--safe-area-top))] md:pb-10 md:pt-[max(2.5rem,var(--safe-area-top))] sm:pl-6 sm:pr-6">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-raised)] sm:rounded-[28px] md:grid-cols-[1.05fr_0.95fr] md:rounded-[32px]">

          {/* Panel izquierdo — gradiente coral como TripHeroCard */}
          <section
            className="relative hidden overflow-hidden p-10 text-white md:flex md:flex-col md:justify-between"
            style={{
              background: "linear-gradient(135deg, #F87171 0%, #EF4444 55%, #DC2626 100%)",
            }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <span
                className="absolute -right-12 -top-12 h-48 w-48 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <span
                className="absolute bottom-8 left-8 h-32 w-32 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            </div>

            <div className="relative z-10">
              <div className="max-w-md">
                <KaviroLogo variant="light" size="lg" withWordmark imageClassName="scale-[1.04] origin-left" />
                <p className="mt-3 text-sm text-white/80">Organiza tus viajes en un solo lugar</p>
              </div>

              <div className="mt-12 max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/20">
                  <span>Acceso</span>
                  <span>•</span>
                  <span>{APP_NAME}</span>
                </div>

                <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
                  Planifica y disfruta cada viaje con tu asistente personal.
                </h1>

                <p className="mt-4 text-base leading-7 text-white/80">
                  Itinerarios, gastos compartidos, mapa, rutas y asistente IA en una sola app.
                </p>
              </div>
            </div>
          </section>

          {/* Formulario */}
          <section className="flex min-w-0 items-start justify-center bg-[var(--surface-card)] p-4 sm:p-8 md:p-10">
            <div className="w-full min-w-0 max-w-xl">
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-card)] sm:rounded-[28px] sm:p-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-6 sm:gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-page)]"
                  >
                    Volver a inicio
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-page)]"
                  >
                    Ayuda
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                  >
                    Ver precios
                  </Link>
                  <DarkModeToggle />
                </div>
                <div className="mb-6 text-center sm:mb-8">
                  <div className="mb-4 flex justify-center sm:mb-5">
                    <span className="block dark:hidden">
                      <KaviroLogo href="/" variant="dark" size="lg" withWordmark />
                    </span>
                    <span className="hidden dark:block">
                      <KaviroLogo href="/" variant="light" size="lg" withWordmark />
                    </span>
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                    {title}
                  </h3>
                  {subtitle ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] sm:mt-3 sm:text-base">{subtitle}</p>
                  ) : null}
                </div>

                {children}
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
