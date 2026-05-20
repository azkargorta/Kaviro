import Link from "next/link";
import type { Metadata } from "next";
import { Check, Zap, Map, Users, CreditCard, FileText, Star, ArrowRight, Lock, X } from "lucide-react";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import {
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  PRICING_COMPARISON_ROWS,
  PRICING_FAQ,
  PRICING_PRICES,
} from "@/lib/pricing-public";
import { FREE_TRIP_LIMIT } from "@/lib/premium-copy";

export const metadata: Metadata = {
  title: "Precios · Kaviro",
  description: `Plan gratuito: hasta ${FREE_TRIP_LIMIT} viajes y funciones esenciales. Premium desde ${PRICING_PRICES.monthly}/mes con asistente IA y análisis de documentos.`,
  openGraph: {
    title: "Precios · Kaviro",
    description: `Gratis hasta ${FREE_TRIP_LIMIT} viajes. Premium con IA desde ${PRICING_PRICES.monthly}/mes.`,
  },
};

const FREE_ICONS: Record<string, typeof Map> = {
  plan: Map,
  participants: Users,
  expenses: CreditCard,
  docs: FileText,
  share: Check,
  places: Check,
  export: Check,
  trips: Check,
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] px-6 py-12 text-center md:px-12 md:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Precios</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Organiza gratis. Potencia con Premium.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/85">
            El plan gratuito cubre plan, mapa, gastos y documentos para tu grupo. Premium añade IA: itinerarios,
            análisis de tickets y rutas automáticas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-[var(--brand)] transition hover:bg-slate-50"
            >
              Empezar gratis
            </Link>
            <Link
              href="/auth/login?next=/account?upgrade=premium#premium-plans"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Zap className="h-4 w-4" />
              Premium — {PRICING_PRICES.monthly}/mes
            </Link>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Plan gratuito</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              0€
              <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Ideal para probar Kaviro con tu grupo sin tarjeta.
            </p>
            <ul className="mt-6 space-y-3">
              {FREE_PLAN_FEATURES.map(({ key, text }) => {
                const Icon = FREE_ICONS[key] ?? Check;
                return (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <Icon className="h-4 w-4 shrink-0 text-emerald-500" />
                    {text}
                  </li>
                );
              })}
            </ul>
            <Link
              href="/auth/register"
              className="mt-8 flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white dark:hover:bg-[#1E293B]"
            >
              Crear cuenta gratis
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--brand-border)] bg-white p-6 shadow-sm dark:bg-[#0F1623] md:p-8">
            <div className="absolute right-4 top-4 rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Popular
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Plan Premium</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {PRICING_PRICES.monthly}
              <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              o {PRICING_PRICES.yearly} / año — {PRICING_PRICES.yearlyNote}
            </p>
            <ul className="mt-6 space-y-3">
              {PREMIUM_PLAN_FEATURES.map(({ key, text, highlight }) => (
                <li
                  key={key}
                  className={`flex items-center gap-2.5 text-sm ${
                    highlight ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {highlight ? (
                    <Zap className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                  ) : (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/auth/login?next=/account?upgrade=premium#premium-plans"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
              >
                <Zap className="h-4 w-4" />
                Hazte Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-slate-400">
                <Lock className="mr-1 inline h-3 w-3" />
                Cancela cuando quieras · Pago seguro con Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-[#1E293B]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparativa de planes</h3>
          </div>
          <div className="grid grid-cols-[1fr_88px_88px] items-center border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-[#1E293B] dark:bg-[#080C14]">
            <span>Función</span>
            <span className="text-center">Gratis</span>
            <span className="text-center text-[var(--brand)]">Premium</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {PRICING_COMPARISON_ROWS.map((row) => (
              <div key={row.feature} className="grid grid-cols-[1fr_88px_88px] items-center px-6 py-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">{row.feature}</span>
                <Cell value={row.free} />
                <Cell value={row.premium} premium />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Preguntas frecuentes</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {PRICING_FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-[#1E293B] dark:bg-[#080C14]"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-8 text-center">
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">¿Listo para organizar tu próximo viaje?</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Empieza gratis con hasta {FREE_TRIP_LIMIT} viajes. Activa Premium cuando quieras IA.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            >
              Empezar gratis
            </Link>
            <Link
              href="/auth/login?next=/account?upgrade=premium#premium-plans"
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
            >
              <Star className="h-4 w-4" />
              Premium — {PRICING_PRICES.monthly}/mes
            </Link>
          </div>
        </div>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}

function Cell({ value, premium = false }: { value: boolean | string; premium?: boolean }) {
  if (typeof value === "string") {
    return (
      <span className={`text-center text-[11px] font-semibold leading-tight ${premium ? "text-[var(--brand)]" : "text-slate-600 dark:text-slate-400"}`}>
        {value}
      </span>
    );
  }
  return (
    <span className="flex justify-center">
      {value ? (
        <Check className={`h-4 w-4 ${premium ? "text-[var(--brand)]" : "text-emerald-500"}`} />
      ) : (
        <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      )}
    </span>
  );
}
