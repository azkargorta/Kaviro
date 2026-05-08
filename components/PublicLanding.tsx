"use client";

import Link from "next/link";
import { useEffect } from "react";
import TripBoardLogo from "@/components/brand/TripBoardLogo";
import { ArrowRight, CalendarDays, Check, MapPinned, Sparkles, Wallet } from "lucide-react";
import { PremiumBadge } from "@/components/layout/PremiumBadge";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

function Feature({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
      <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

/**
 * Landing pública.
 *
 * Importante: mantenemos el “escape hatch” para enlaces de Supabase con tokens
 * en el hash (#) o con `code` en query para recovery/OAuth.
 */
export default function PublicLanding() {
  useEffect(() => {
    const { hash, search } = window.location;
    const code = new URLSearchParams(search).get("code");

    if (code) {
      const q = new URLSearchParams({
        code,
        next: "/auth/reset-password",
        type: "recovery",
      });
      window.location.replace(`/auth/callback?${q.toString()}`);
      return;
    }

    if (hash && (hash.includes("type=recovery") || hash.includes("access_token"))) {
      window.location.replace(`/auth/reset-password${hash}`);
      return;
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50/80 via-slate-50 to-violet-100/60 dark:bg-gradient-to-b dark:from-[#080C14] dark:via-[#080C14] dark:to-[#080C14]">
      <header className="absolute left-0 right-0 top-0 z-50 dark:bg-[#080C14]/90 dark:backdrop-blur-sm">
        <div className="page-shell flex items-center justify-between py-3 sm:py-4">
          {/* Logo: dark variant in light mode, light variant in dark mode */}
          <div className="block dark:hidden">
            <TripBoardLogo href="/" variant="dark" size="lg" withWordmark imageClassName="h-10 max-h-10 sm:h-12 sm:max-h-12" />
          </div>
          <div className="hidden dark:block">
            <TripBoardLogo href="/" variant="light" size="lg" withWordmark imageClassName="h-10 max-h-10 sm:h-12 sm:max-h-12 brightness-200" />
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F87171] bg-transparent px-4 text-sm font-semibold text-[#F87171] transition hover:bg-[#F87171]/10 dark:bg-[#F87171] dark:text-white dark:border-[#F87171] dark:hover:bg-[#EF4444]"
            >
              Precios
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#F87171] bg-transparent px-4 text-sm font-semibold text-[#F87171] transition hover:bg-[#F87171]/10 dark:bg-[#F87171] dark:text-white dark:border-[#F87171] dark:hover:bg-[#EF4444]"
            >
              Entrar
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/auth/register"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#4F46E5] px-4 text-sm font-semibold text-white transition hover:bg-[#4338CA] dark:bg-[#4F46E5] dark:text-white dark:hover:bg-[#4338CA]"
              >
                Crear cuenta
              </Link>
              <PremiumBadge />
            </div>
            <DarkModeToggle />
          </nav>
        </div>
      </header>

      <section className="page-shell pb-8 pt-20 sm:pb-10 sm:pt-24 md:pb-12 md:pt-28">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-cyan-200/50 bg-gradient-to-br from-white via-cyan-50/50 to-violet-100/70 p-5 shadow-lg shadow-cyan-900/5 sm:rounded-[2rem] sm:p-7 md:rounded-[2.25rem] md:p-9 lg:p-10 dark:border-[#1E293B] dark:from-[#0D1117] dark:via-[#0D1117] dark:to-[#0D1117]">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1.5 text-xs font-semibold text-cyan-950 dark:border-[#F87171]/30 dark:bg-[#F87171]/10 dark:text-[#FCA5A5]">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-700" aria-hidden />
                  Menos caos, más viaje
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-[2.65rem] md:leading-tight dark:text-white">
                Organiza todo tu viaje en un solo lugar
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base md:text-lg dark:text-slate-300">
                Itinerario, gastos, rutas y planes sin caos. Gratis: mapa, plan por días y reparto de gastos. Premium:
                asistente personal, documentos y automatización.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-hover)]"
                >
                  Crear viaje
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  <Link href="/pricing" className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline dark:text-[var(--brand)]">
                    Ver precios y planes
                  </Link>
                </span>
              </div>

              <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-white to-violet-50/90 p-4 shadow-sm md:p-5 dark:border-[#1E293B] dark:from-[#0F1623] dark:to-[#0F1623]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90 dark:text-[#F87171]">Qué incluye</p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-800 sm:grid-cols-2 dark:text-slate-300">
                  <Feature>Plan por días con horas</Feature>
                  <Feature>Rutas entre paradas sobre el mapa</Feature>
                  <Feature>Gastos y balances del grupo</Feature>
                  <Feature>Premium: asistente personal y OCR de reservas</Feature>
                </ul>
                <p className="mt-3 text-center text-xs text-slate-600">
                  <Link href="/pricing" className="font-semibold text-[var(--brand)] hover:underline dark:text-[var(--brand)]">
                    Comparar planes
                  </Link>
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-cyan-900 to-violet-950 p-6 text-white shadow-xl md:p-8 dark:from-[#1a0533] dark:via-[#0f0a2e] dark:to-[#0d1535] dark:border-[#F87171]/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" aria-hidden />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4" />
                  <p className="text-sm font-medium leading-relaxed text-cyan-50/95">
                    Todo lo esencial del viaje en un panel: agenda, rutas, gastos y asistente cuando tengas Premium.
                  </p>
                  <ul className="space-y-3">
                    {[
                      { label: "Plan e itinerario", sub: "Por días y horas", icon: CalendarDays, tone: "from-sky-400 to-cyan-300" },
                      { label: "Rutas", sub: "Paradas enlazadas", icon: MapPinned, tone: "from-emerald-400 to-teal-300" },
                      { label: "Gastos del grupo", sub: "Balances claros", icon: Wallet, tone: "from-amber-400 to-orange-300" },
                      { label: "Asistente personal", sub: "Premium", icon: Sparkles, tone: "from-violet-400 to-fuchsia-300" },
                    ].map((row) => {
                      const RowIcon = row.icon;
                      return (
                      <li
                        key={row.label}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm"
                      >
                        <span
                          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${row.tone} text-slate-900 shadow-inner`}
                        >
                          <RowIcon className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">{row.label}</p>
                          <p className="text-xs text-cyan-100/80">{row.sub}</p>
                        </div>
                      </li>
                    );
                    })}
                  </ul>
                </div>
              </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-violet-200/40 bg-gradient-to-r from-slate-100/90 via-white to-cyan-50/80 dark:border-[#1E293B] dark:from-[#080C14] dark:via-[#080C14] dark:to-[#080C14]">
        <div className="page-shell flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">Kaviro</span> · Organiza viajes, gastos y rutas
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/pricing" className="font-semibold text-slate-500 dark:text-slate-400 hover:underline">
              Precios
            </Link>
            <Link href="/auth/login" className="font-semibold text-slate-500 dark:text-slate-400 hover:underline">
              Entrar
            </Link>
            <Link href="/auth/register" className="font-semibold text-slate-500 dark:text-slate-400 hover:underline">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

