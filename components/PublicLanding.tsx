"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import KaviroOfficialBrandBanner from "@/components/marketing/KaviroOfficialBrandBanner";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import Reveal from "@/components/ui/Reveal";
import CountUpStat from "@/components/ui/CountUpStat";
import { FREE_TRIP_LIMIT, freePlanBanner } from "@/lib/premium-copy";
import PlanActivityRow from "@/components/trip/plan/PlanActivityRow";
import PlanItineraryCard from "@/components/trip/plan/PlanItineraryCard";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Luggage,
  Map,
  MapPinned,
  MessageCircle,
  Monitor,
  Route,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Table2,
  Users,
  Wallet,
  X,
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

// ── Shared UI ─────────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623] dark:hover:border-slate-600">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--brand)]/80 via-[var(--brand)]/40 to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent ?? "bg-[var(--brand-light)] text-[var(--brand)]"}`}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Reveal variant="fade">
      <div className="text-center">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</div>
        <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </Reveal>
  );
}

function Testimonial({ text, name, trip }: { text: string; name: string; trip: string }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="mb-3 flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">&ldquo;{text}&rdquo;</p>
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-[#1E293B]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
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

// ── Data ──────────────────────────────────────────────────────────────────────
const DESTINATION_CHIPS = [
  "París",
  "Roma",
  "Lisboa",
  "Japón",
  "Tailandia",
  "Islandia",
] as const;

const HERO_PILLS = [
  { icon: CalendarDays, label: "Itinerario" },
  { icon: Wallet, label: "Gastos" },
  { icon: FileText, label: "Documentos" },
  { icon: Route, label: "Rutas" },
  { icon: Users, label: "Participantes" },
] as const;

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Itinerario día a día",
    desc: "Organiza actividades por fecha, hora y lugar. Todo el grupo ve el mismo plan en tiempo real.",
  },
  {
    icon: MapPinned,
    title: "Rutas en el mapa",
    desc: "Conecta paradas, calcula distancias y comprueba que el orden del día tiene sentido.",
  },
  {
    icon: Wallet,
    title: "Gastos compartidos",
    desc: "Registra quién pagó qué y calcula balances al instante. Sin Excel ni discusiones.",
  },
  {
    icon: FileText,
    title: "Documentos del viaje",
    desc: "Vuelos, reservas y tickets en un solo sitio. Accesibles para todo el grupo.",
  },
  {
    icon: Users,
    title: "Grupo sincronizado",
    desc: "Invita con un enlace. Cada participante consulta y colabora desde móvil u ordenador.",
  },
  {
    icon: Sparkles,
    title: "Asistente IA (Premium)",
    desc: "Genera itinerarios, sugiere rutas y analiza documentos cuando tú o un compañero tiene Premium.",
  },
] as const;

const BEFORE_TOOLS = [
  { icon: MessageCircle, label: "WhatsApp", problem: "Planes y enlaces perdidos en el chat" },
  { icon: Table2, label: "Excel", problem: "Gastos desactualizados y versiones distintas" },
  { icon: Map, label: "Maps", problem: "Rutas sueltas sin contexto del viaje" },
  { icon: FileText, label: "Documentos", problem: "PDFs y capturas repartidos por todos lados" },
] as const;

const KAVIRO_WINS = [
  "Un solo viaje con itinerario, gastos y documentos",
  "Todo el grupo ve lo mismo, sin reenviar mensajes",
  "Funciona en móvil y ordenador, online u offline",
  "Comparte el recap al volver",
] as const;

const STEPS = [
  {
    step: "01",
    icon: Luggage,
    title: "Crea el viaje",
    desc: "Nombre, destino, fechas e invitación al grupo con un enlace.",
  },
  {
    step: "02",
    icon: MapPinned,
    title: "Centraliza el plan",
    desc: "Añade días, rutas, gastos y documentos. O pide ayuda al asistente IA (Premium).",
  },
  {
    step: "03",
    icon: Share2,
    title: "Viaja sin caos",
    desc: "Consulta el plan en destino, registra gastos y comparte el recap al volver.",
  },
] as const;

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
} as const;

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicLanding() {
  useAuthRedirect();
  const [activePlan, setActivePlan] = useState<"día1" | "día2" | "día3">("día1");
  const parallaxBlobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blob = parallaxBlobRef.current;
    if (reducedMotion || !blob) return;

    const onScroll = () => {
      blob.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.35}px)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            ref={parallaxBlobRef}
            className="absolute -top-40 left-1/2 h-[520px] w-[900px] rounded-full bg-[var(--brand)]/8 blur-3xl"
            style={{ transform: "translateX(-50%)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 xl:gap-16">
            <Reveal variant="slide" className="space-y-5 lg:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-1.5 text-xs font-bold text-[var(--brand)]">
                <Users className="h-3.5 w-3.5" aria-hidden />
                Viajes en grupo, sin caos
              </div>

              <h1 className="text-[2rem] font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.15rem]">
                Organiza tu viaje en grupo{" "}
                <span className="text-[var(--brand)]">en un solo lugar</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Kaviro centraliza itinerario, gastos compartidos, documentos, rutas y participantes.
                Olvídate de mezclar WhatsApp, Excel, Maps y archivos sueltos.
              </p>

              <div className="flex flex-wrap gap-2">
                {HERO_PILLS.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-[#1E293B] dark:bg-[#0F1623]/90 dark:text-slate-200"
                  >
                    <Icon className="h-3.5 w-3.5 text-[var(--brand)]" aria-hidden />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {DESTINATION_CHIPS.map((dest) => (
                  <span
                    key={dest}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-[#141c2b] dark:text-slate-400"
                  >
                    <MapPinned className="h-3 w-3 text-slate-400" aria-hidden />
                    {dest}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                <Link
                  href="/auth/register"
                  className="btn-press inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[var(--brand)] px-8 text-base font-bold text-white shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-hover)]"
                >
                  Crear mi viaje gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-white dark:hover:bg-[#141c2b]"
                >
                  Entrar
                </Link>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="font-bold text-[var(--brand)] underline-offset-2 hover:underline"
                >
                  Inicia sesión
                </Link>
                {" · "}
                <Link href="/pricing" className="font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Ver planes
                </Link>
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                  Móvil
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                  Ordenador
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                  Gratis para empezar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                  Sin tarjeta
                </span>
              </div>
            </Reveal>

            <Reveal variant="scale" delay={1} className="relative lg:justify-self-end">
              <div className="hero-float relative mx-auto w-full max-w-lg lg:max-w-none">
                <div className="rounded-[1.35rem] shadow-xl shadow-slate-900/8 ring-1 ring-slate-200/80 dark:shadow-black/30 dark:ring-[#1E293B]">
                  <PlanItineraryCard
                    destination="París, Francia"
                    tripName="Viaje a París 2026"
                    participants={["Unai", "María", "Jorge"]}
                    days={["2026-05-28", "2026-05-29", "2026-05-30"]}
                    selectedDate={
                      activePlan === "día1"
                        ? "2026-05-28"
                        : activePlan === "día2"
                          ? "2026-05-29"
                          : "2026-05-30"
                    }
                    onSelectDate={(d) => {
                      if (d === "2026-05-28") setActivePlan("día1");
                      else if (d === "2026-05-29") setActivePlan("día2");
                      else setActivePlan("día3");
                    }}
                    tripId="preview"
                    expenseFooter={
                      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#1E293B]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-400 dark:ring-[#1E293B]">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">3 participantes</p>
                            <p className="text-[10px] font-medium text-slate-400">Mismo plan, en tiempo real</p>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 sm:max-w-[11rem]">
                          <div className="min-w-0 flex-1 text-right sm:text-left">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Gastos del grupo
                            </p>
                            <p className="text-xs font-extrabold tabular-nums text-[var(--brand)]">€342</p>
                          </div>
                          <div
                            className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]"
                            aria-hidden
                          >
                            <div className="h-full w-3/5 rounded-full bg-[var(--brand)]" />
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div
                      className="mb-3 flex items-start gap-2.5 rounded-xl border border-[var(--brand-border)]/70 bg-[var(--brand-light)]/45 px-3 py-2.5"
                      aria-label="Sugerencia de IA"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)]/60 dark:bg-[#141c2b]">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">IA sugiere</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
                          Añadir traslado al aeropuerto antes del vuelo de vuelta
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {PREVIEW[activePlan].map((a) => (
                        <PlanActivityRow
                          key={a.title}
                          title={a.title}
                          place={a.place}
                          time={a.time}
                          icon={a.icon}
                        />
                      ))}
                    </div>
                  </PlanItineraryCard>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value="2 min" label="Para crear tu primer viaje" />
            <Stat value="100%" label="Gratis para empezar" />
            <Reveal variant="fade" delay={2}>
              <CountUpStat value={FREE_TRIP_LIMIT} label="Viajes en plan gratis" />
            </Reveal>
            <Stat value="1 clic" label="Para invitar al grupo" />
          </div>
        </div>
      </section>

      {/* ── Antes / Ahora ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="compare-heading">
        <Reveal variant="fade" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
            Menos apps, más viaje
          </p>
          <h2 id="compare-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Antes vs. con Kaviro
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
            Deja de repartir el plan entre chats, hojas de cálculo y capturas. Todo el grupo trabaja sobre la misma base.
          </p>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <Reveal variant="slide" className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-[#1E293B] dark:bg-[#080C14]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Antes · WhatsApp + Excel + Maps
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                {BEFORE_TOOLS.map(({ icon: Icon, label, problem }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#334155] dark:bg-[#080C14]/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm dark:bg-[#0F1623]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
                        <X className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{problem}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-auto pt-2 text-center text-xs font-medium text-slate-400">
                  Información repartida · versiones distintas · caos en el grupo
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal variant="slide" delay={1} className="h-full">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--brand-border)] bg-white shadow-md dark:bg-[#0F1623]">
              <div className="border-b border-[var(--brand-border)] bg-[var(--brand-light)] px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand)]">
                  Ahora · Kaviro
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                {KAVIRO_WINS.map((win) => (
                  <div key={win} className="flex items-start gap-3 rounded-xl bg-slate-50/60 px-4 py-3 dark:bg-[#141c2b]/50">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{win}</p>
                  </div>
                ))}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {HERO_PILLS.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-[var(--brand-light)] px-2.5 py-1 text-[10px] font-bold text-[var(--brand)]"
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="border-y border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal variant="fade" className="mb-12 text-center">
            <h2 id="features-heading" className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Todo lo que un viaje en grupo necesita
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              Desde la primera reunión de planificación hasta el recap al volver. Una app, todo el grupo.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
              <Reveal key={title} variant="slide" delay={(idx % 3) as 0 | 1 | 2}>
                <FeatureCard
                  icon={<Icon className="h-5 w-5" aria-hidden />}
                  title={title}
                  desc={desc}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="steps-heading">
        <Reveal variant="fade" className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
            Cómo funciona
          </p>
          <h2 id="steps-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            En 3 pasos, listo para viajar
          </h2>
        </Reveal>

        <div className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
          <div
            className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[var(--brand)]/40 to-transparent sm:block"
            aria-hidden
          />
          {STEPS.map(({ step, icon: Icon, title, desc }, idx) => (
            <Reveal key={step} variant="scale" delay={(idx % 3) as 0 | 1 | 2} className="relative text-center">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[var(--brand)] shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                <Icon className="h-7 w-7" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-black text-white">
                  {step}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials (unified) ── */}
      <section className="border-t border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal variant="fade" className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Lo que dicen los viajeros
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Grupos reales que dejaron el caos atrás
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                text: "Nunca habíamos organizado un viaje de grupo tan bien. El reparto de gastos nos salvó de más de una discusión.",
                name: "Marina G.",
                trip: "Roma · 6 personas",
                variant: "left" as const,
              },
              {
                text: "Por fin una app que entiende que viajar en grupo es caos. Los balances automáticos nos salvaron en Japón.",
                name: "Marta G.",
                trip: "Japón · 6 personas",
                variant: "fade" as const,
              },
              {
                text: "El mapa con las rutas entre paradas es lo que más me gusta. Ves de un vistazo si el orden tiene sentido.",
                name: "Ane M.",
                trip: "Costa Amalfitana",
                variant: "right" as const,
              },
            ].map((t, idx) => (
              <Reveal key={t.name} variant={t.variant} delay={(idx % 3) as 0 | 1 | 2}>
                <Testimonial text={t.text} name={t.name} trip={t.trip} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <KaviroOfficialBrandBanner />
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden border-t border-slate-200 bg-white px-4 py-20 dark:border-[#1E293B] dark:bg-[#080C14] sm:px-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-[var(--brand)]/8 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-slate-200/50 blur-3xl dark:bg-[#1E293B]/50" />
        </div>
        <Reveal variant="scale" className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-1.5 text-xs font-bold text-[var(--brand)]">
            <Luggage className="h-3.5 w-3.5" aria-hidden />
            Tu próxima aventura empieza aquí
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Empaca la maleta.{" "}
            <span className="text-[var(--brand)]">Nosotros organizamos el resto.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Crea tu viaje gratis en 2 minutos. Invita al grupo y deja de perseguir mensajes, hojas y mapas sueltos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="btn-press inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[var(--brand)] px-8 text-base font-bold text-white shadow-lg shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-hover)]"
            >
              Crear viaje gratis
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-slate-800 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-white dark:hover:bg-[#141c2b]"
            >
              Entrar
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-bold text-[var(--brand)] underline-offset-2 hover:underline">
              Inicia sesión
            </Link>
            {" · "}
            <Link href="/pricing" className="font-semibold hover:text-slate-800 dark:hover:text-white">
              Ver planes Premium
            </Link>
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <Reveal variant="fade">
          <p className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-5 py-4 text-center text-sm text-slate-700 dark:text-slate-300">
            {freePlanBanner()}{" "}
            <Link href="/pricing" className="font-semibold text-[var(--brand)] hover:underline">
              Ver comparativa de planes
            </Link>
          </p>
        </Reveal>
      </section>

      <PublicMarketingFooter />
    </main>
  );
}
