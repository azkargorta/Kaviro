"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import { FREE_TRIP_LIMIT, freePlanBanner } from "@/lib/premium-copy";
import PlanActivityRow from "@/components/trip/plan/PlanActivityRow";
import PlanItineraryCard from "@/components/trip/plan/PlanItineraryCard";
import {
  ArrowRight, CalendarDays, MapPinned, Wallet, Sparkles,
  Users, Share2, CheckCircle2, Star,
} from "lucide-react";

// ── Auth redirect (keep existing logic) ──────────────────────────────────────
function useAuthRedirect() {
  useEffect(() => {
    const { hash, search } = window.location;
    const code = new URLSearchParams(search).get("code");
    if (code) {
      const q = new URLSearchParams({ code, next: "/auth/reset-password", type: "recovery" });
      window.location.replace(`/auth/callback?${q.toString()}`);
      return;
    }
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token"))) {
      window.location.replace(`/auth/reset-password${hash}`);
    }
  }, []);
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, desc, color,
}: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

// ── Testimonial ───────────────────────────────────────────────────────────────
function Testimonial({ text, name, trip }: { text: string; name: string; trip: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">"{text}"</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-[#F87171] flex items-center justify-center text-xs font-bold text-white">
          {name[0]}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">{name}</p>
          <p className="text-[10px] text-slate-400">{trip}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicLanding() {
  useAuthRedirect();
  const [activePlan, setActivePlan] = useState<"día1" | "día2" | "día3">("día1");

  const PREVIEW = {
    día1: [
      { time: "09:00", title: "Torre Eiffel", place: "Champ de Mars, París", icon: "🗼" },
      { time: "13:00", title: "Almuerzo en Le Marais", place: "4 Rue de Bretagne", icon: "🍽️" },
      { time: "16:00", title: "Museo del Louvre", place: "Rue de Rivoli", icon: "🏛️" },
    ],
    día2: [
      { time: "10:00", title: "Montmartre", place: "Basílica del Sacré-Cœur", icon: "⛪" },
      { time: "14:00", title: "Mercado de Aligre", place: "Place d'Aligre", icon: "🧺" },
      { time: "19:00", title: "Crucero por el Sena", place: "Pont de l'Alma", icon: "🚢" },
    ],
    día3: [
      { time: "09:30", title: "Versalles", place: "Place d'Armes, Versailles", icon: "🏰" },
      { time: "15:00", title: "Jardines de Versalles", place: "Parterre d'Eau", icon: "🌿" },
      { time: "20:00", title: "Cena en Saint-Germain", place: "Boulevard Saint-Germain", icon: "🍷" },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#080C14] overflow-x-hidden">

      <PublicMarketingHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#F87171]/10 blur-3xl" />
          <div className="absolute top-20 right-0 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left — copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F87171]/30 bg-[#F87171]/10 px-3 py-1.5 text-xs font-bold text-[#F87171]">
                <Sparkles className="h-3 w-3" />
                Premium · Asistente IA
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                El viaje perfecto,{" "}
                <span className="text-[#F87171]">organizado</span>{" "}
                para ti
              </h1>

              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Plan día a día, rutas en el mapa y gastos del grupo en un solo lugar. Con Premium, añade asistente IA y análisis de documentos.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#F87171] px-8 text-base font-bold text-white shadow-lg shadow-[#F87171]/25 transition hover:bg-[#EF4444] hover:shadow-[#F87171]/40"
                >
                  Crear mi viaje gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-[#F87171]/40 bg-white px-8 text-base font-bold text-[#F87171] transition hover:border-[#F87171] hover:bg-[#F87171]/5 dark:border-[#F87171]/50 dark:bg-[#0F1623] dark:text-[#F87171] dark:hover:bg-[#F87171]/10"
                >
                  Entrar
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B] sm:w-auto w-full"
                >
                  Ver planes
                </Link>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="font-bold text-[#F87171] underline-offset-2 hover:underline">
                  Entra aquí
                </Link>
              </p>

              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Gratis para siempre</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sin tarjeta</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Listo en 2 min</span>
              </div>
            </div>

            {/* Right — UI preview */}
            <div className="relative overflow-hidden shadow-2xl">
              <PlanItineraryCard
                destination="París, Francia"
                tripName="Viaje a París 2026"
                participants={["Unai", "María", "Jorge"]}
                days={["2026-05-28", "2026-05-29", "2026-05-30"]}
                selectedDate={activePlan === "día1" ? "2026-05-28" : activePlan === "día2" ? "2026-05-29" : "2026-05-30"}
                onSelectDate={(d) => {
                  if (d === "2026-05-28") setActivePlan("día1");
                  else if (d === "2026-05-29") setActivePlan("día2");
                  else setActivePlan("día3");
                }}
                tripId="preview"
                expenseFooter={
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-[#1E293B]">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gastos del grupo</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
                        <div className="h-full w-3/5 rounded-full bg-[#F87171]" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">€342</span>
                    </div>
                  </div>
                }
              >
                <div className="space-y-2">
                  {PREVIEW[activePlan].map((a) => (
                    <PlanActivityRow key={a.title} title={a.title} place={a.place} time={a.time} icon={a.icon} />
                  ))}
                </div>
              </PlanItineraryCard>

              <div className="absolute bottom-14 right-3 z-10 sm:bottom-16 sm:right-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">✨ IA sugiere</p>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Añadir traslado al aeropuerto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value="2 min" label="Para crear tu primer viaje" />
            <Stat value="100%" label="Gratis para empezar" />
            <Stat value={`${FREE_TRIP_LIMIT}`} label="Viajes en plan gratis" />
            <Stat value="1 clic" label="Para compartir el plan" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Todo lo que necesitas para viajar sin caos
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Desde el primer día de planificación hasta el recap final. Sin cambiar de app.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<CalendarDays className="h-6 w-6 text-white" />}
            color="bg-[#F87171]"
            title="Plan día a día"
            desc="Arrastra y ordena actividades. Añade horas, lugares y notas. Exporta a PDF o calendario."
          />
          <FeatureCard
            icon={<MapPinned className="h-6 w-6 text-white" />}
            color="bg-emerald-500"
            title="Rutas en el mapa"
            desc="Conecta tus paradas sobre el mapa. Calcula distancias y tiempos de desplazamiento."
          />
          <FeatureCard
            icon={<Wallet className="h-6 w-6 text-white" />}
            color="bg-amber-500"
            title="Gastos del grupo"
            desc="Registra tickets, divide por persona y calcula quién debe a quién al instante."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-white" />}
            color="bg-[#F87171]"
            title="Asistente IA (Premium)"
            desc="Itinerarios en lenguaje natural, rutas automáticas y análisis de tickets. También activo si un compañero tiene Premium."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-pink-500"
            title="Viaja en grupo"
            desc="Invita a los compañeros con un enlace. Todos ven el plan en tiempo real."
          />
          <FeatureCard
            icon={<Share2 className="h-6 w-6 text-white" />}
            color="bg-sky-500"
            title="Comparte el recuerdo"
            desc="Al volver, genera una tarjeta resumen con stats del viaje para compartir en redes."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white dark:bg-[#0F1623] border-y border-slate-200 dark:border-[#1E293B]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-12">
            Tres pasos para el viaje perfecto
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "Crea el viaje", desc: "Ponle nombre, destino y fechas. Invita a los compañeros con un enlace.", icon: "✈️" },
              { step: "02", title: "Arma el plan", desc: "Añade actividades en el mapa o pide un itinerario al asistente IA (Premium).", icon: "🗺️" },
              { step: "03", title: "Viaja sin caos", desc: "Consulta el plan offline, registra gastos y comparte el recap al volver.", icon: "🎉" },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#080C14] text-3xl border border-slate-200 dark:border-[#1E293B]">
                  {item.icon}
                </div>
                <div className="absolute -top-2 -right-2 sm:right-auto sm:-left-2 h-6 w-6 rounded-full bg-[#F87171] flex items-center justify-center text-[10px] font-black text-white">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-10">
          Lo que dicen los viajeros
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Testimonial
            text="Nunca habíamos organizado un viaje de grupo tan bien. El reparto de gastos nos salvó de más de una discusión."
            name="Marina G."
            trip="Roma con 6 personas"
          />
          <Testimonial
            text="Le pedí al asistente un itinerario de 5 días en Lisboa y en 30 segundos tenía algo mejor que lo que yo habría hecho en horas."
            name="Carlos P."
            trip="Lisboa en pareja"
          />
          <Testimonial
            text="El mapa con las rutas entre paradas es lo que más me gusta. Ves de un vistazo si el orden tiene sentido geográficamente."
            name="Ane M."
            trip="Costa Amalfitana"
          />
        </div>
      </section>

      
      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Lo que dicen los viajeros
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {([
            { quote: "Por fin una app que entiende que viajar en grupo es caos. Los balances automáticos nos salvaron la vida en el viaje a Japón.", name: "Marta G.", trip: "Japón · 6 personas", emoji: "🗾" },
            { quote: "El asistente IA nos montó el itinerario de 10 días por Italia en 3 minutos. Lo que habríamos tardado horas.", name: "Carlos R.", trip: "Italia · 4 personas", emoji: "🇮🇹" },
            { quote: "Llevamos 3 viajes con Kaviro. Nunca más discusiones de quién pagó qué, porque todo queda registrado.", name: "Ana y Pablo", trip: "Viajes en grupo", emoji: "✈️" },
          ] as const).map(({ quote, name, trip, emoji }) => (
            <div key={name} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1E293B] dark:bg-[#0F1623]">
              <p className="text-2xl mb-3">{emoji}</p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{quote}</p>
              <div className="mt-4 border-t border-slate-100 dark:border-[#1E293B] pt-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                <p className="text-[11px] text-slate-400">{trip}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

{/* ── CTA final ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] py-20 px-4">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Tu próximo viaje merece estar bien organizado
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Empieza gratis. Sin tarjeta. En 2 minutos ya tienes tu primer viaje creado.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-[#F87171] shadow-lg transition hover:bg-slate-50"
            >
              Crear viaje gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-white/70 bg-white/10 px-8 text-base font-bold text-white transition hover:bg-white/20"
            >
              Entrar
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/30 px-8 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Ver planes Premium
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/80">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-bold text-white underline-offset-2 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <p className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-5 py-4 text-center text-sm text-slate-700 dark:text-slate-300">
          {freePlanBanner()}{" "}
          <Link href="/pricing" className="font-semibold text-[var(--brand)] hover:underline">
            Ver comparativa de planes
          </Link>
        </p>
      </section>

      <PublicMarketingFooter />
    </main>
  );
}
