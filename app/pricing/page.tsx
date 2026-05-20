import Link from "next/link";
import { Check, Zap, Users, Map, CreditCard, FileText, Star, ArrowRight, Lock } from "lucide-react";

export const metadata = {
  title: "Precios · Kaviro",
  description: "Plan gratuito para organizar viajes en grupo. Premium desde 3,99€/mes desbloquea el asistente IA y el análisis de documentos.",
  openGraph: {
    title: "Precios · Kaviro",
    description: "Plan gratuito para organizar viajes en grupo. Premium desde 3,99€/mes.",
  },
};

const FREE_FEATURES = [
  { icon: Map,        text: "Plan del viaje con mapa y rutas" },
  { icon: Users,      text: "Hasta 10 participantes por viaje" },
  { icon: CreditCard, text: "Gastos, balances y export CSV" },
  { icon: FileText,   text: "Documentos y reservas" },
  { icon: Check,      text: "Compartir viaje con enlace" },
  { icon: Check,      text: "Autocompletar de lugares" },
  { icon: Check,      text: "Exportar PDF e .ics" },
];

const PREMIUM_FEATURES = [
  { icon: Zap,      text: "Asistente IA personal del viaje", highlight: true },
  { icon: FileText, text: "Analizar tickets y documentos con IA", highlight: true },
  { icon: Check,    text: "Rutas óptimas generadas con IA" },
  { icon: Check,    text: "Itinerarios completos en un clic" },
  { icon: Star,     text: "Soporte prioritario" },
  { icon: Check,    text: "Funciones avanzadas y mejoras continuas" },
];

const FAQ = [
  {
    q: "¿Las rutas y el mapa están incluidos en el plan gratuito?",
    a: "Sí. El plan gratuito incluye mapa interactivo, creación de rutas, autocompletar de lugares con coordenadas y exportación de itinerarios a PDF.",
  },
  {
    q: "¿Qué desbloquea exactamente Premium?",
    a: "El asistente IA personal — que conoce tu viaje completo y puede crear itinerarios, sugerir actividades y reorganizar el plan — y el analizador de documentos, que extrae datos de tickets y reservas automáticamente.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin compromisos ni penalizaciones. Cancelas desde tu cuenta y el plan Premium se mantiene activo hasta el final del período pagado.",
  },
  {
    q: "¿El plan Premium es por persona o por viaje?",
    a: "Es por cuenta. Con un plan Premium organizas todos los viajes que quieras con el asistente IA activado.",
  },
];

export default function PricingPage() {
  return (
    <main className="page-shell pb-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-12 text-center md:px-12 md:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Precios</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Organiza gratis. Vuela con Premium.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-slate-300">
          El plan gratuito ya tiene todo lo esencial. Premium añade el asistente IA que planifica, sugiere y optimiza tu viaje en segundos.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/login?next=/account#premium-plans"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#F87171] px-6 text-sm font-bold text-white transition hover:bg-[#EF4444]"
          >
            <Zap className="h-4 w-4" />
            Empezar gratis
          </Link>
          <Link
            href="/auth/login?next=/account?upgrade=premium#premium-plans"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Hazte Premium — 3,99€/mes
          </Link>
        </div>
      </div>

      {/* ── Plans ────────────────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">

        {/* Free */}
        <div className="card-soft p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Plan gratuito</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                0€
                <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Para empezar a organizar sin pagar nada.</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <Icon className="h-4 w-4 shrink-0 text-emerald-500" />
                {text}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/login"
            className="mt-8 flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-white dark:hover:bg-[#1E293B]"
          >
            Crear cuenta gratis
          </Link>
        </div>

        {/* Premium */}
        <div className="relative card-soft overflow-hidden border-2 border-[#F87171]/40 p-6 md:p-8">
          <div className="absolute right-4 top-4 rounded-full bg-[#F87171] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Popular
          </div>
          <div className="flex items-start justify-between gap-3 pr-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F87171]">Plan Premium</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                3,99€
                <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">o 39,99€ / año — 2 meses gratis</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, text, highlight }) => (
              <li key={text} className={`flex items-center gap-2.5 text-sm ${highlight ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-[#F87171]" : "text-emerald-500"}`} />
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-2.5">
            <Link
              href="/auth/login?next=/account?upgrade=premium#premium-plans"
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#F87171] text-sm font-bold text-white transition hover:bg-[#EF4444]"
            >
              <Zap className="h-4 w-4" />
              Hazte Premium ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-xs text-slate-400">
              <Lock className="mr-1 inline h-3 w-3" />
              Cancela cuando quieras · Pago seguro con Stripe
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature comparison ───────────────────────────────────────────── */}
      <div className="mt-8 card-soft overflow-hidden p-0">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-[#1E293B]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparativa de planes</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
          {[
            { feature: "Plan del viaje y actividades",    free: true,  premium: true },
            { feature: "Mapa, rutas y navegación",        free: true,  premium: true },
            { feature: "Gastos y balances de grupo",      free: true,  premium: true },
            { feature: "Participantes y permisos",        free: true,  premium: true },
            { feature: "Documentos y reservas",           free: true,  premium: true },
            { feature: "Exportar PDF e .ics",             free: true,  premium: true },
            { feature: "Asistente IA personal",           free: false, premium: true },
            { feature: "Análisis de tickets con IA",      free: false, premium: true },
            { feature: "Rutas óptimas con IA",            free: false, premium: true },
            { feature: "Itinerarios completos en un clic",free: false, premium: true },
          ].map(({ feature, free, premium }) => (
            <div key={feature} className="grid grid-cols-[1fr_80px_80px] items-center px-6 py-3">
              <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
              <span className="text-center">
                {free
                  ? <Check className="mx-auto h-4 w-4 text-emerald-500" />
                  : <span className="mx-auto block h-0.5 w-4 rounded bg-slate-200 dark:bg-[#334155]" />
                }
              </span>
              <span className="text-center">
                <Check className="mx-auto h-4 w-4 text-[#F87171]" />
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_80px_80px] items-center bg-slate-50 px-6 py-2 dark:bg-[#080C14]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide"></span>
            <span className="text-center text-xs font-semibold text-slate-500">Gratis</span>
            <span className="text-center text-xs font-bold text-[#F87171]">Premium</span>
          </div>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div className="mt-8 card-soft p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Preguntas frecuentes</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-3xl bg-gradient-to-r from-[#F87171]/10 to-indigo-50 border border-[#F87171]/20 p-8 text-center dark:from-[#F87171]/5 dark:to-indigo-950/20 dark:border-[#F87171]/10">
        <p className="text-lg font-extrabold text-slate-900 dark:text-white">¿Listo para organizar tu próximo viaje?</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Empieza gratis. Hazte Premium cuando quieras el asistente.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Empezar gratis
          </Link>
          <Link
            href="/auth/login?next=/account?upgrade=premium#premium-plans"
            className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[#F87171] px-6 text-sm font-bold text-white transition hover:bg-[#EF4444]"
          >
            <Zap className="h-4 w-4" />
            Hazte Premium — 3,99€/mes
          </Link>
        </div>
      </div>

    </main>
  );
}
