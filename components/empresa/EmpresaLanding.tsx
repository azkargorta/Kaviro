"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import KaviroTripsLogo from "@/components/brand/KaviroTripsLogo";
import EmpresaContactForm from "@/components/empresa/EmpresaContactForm";
import Reveal from "@/components/ui/Reveal";
import CountUpStat from "@/components/ui/CountUpStat";
import {
  AGENCY_PARTNERSHIP_EMAIL,
  APP_NAME,
  agencyPartnershipMailto,
  KAVIRO_TRIPS_PRODUCT_NAME,
} from "@/lib/brand";
import { KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Globe,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  MapPin,
  Palette,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  hasAgency: boolean;
  isLoggedIn: boolean;
  reason?: string;
};

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar({ hasAgency, isLoggedIn }: { hasAgency: boolean; isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1e3a5f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <KaviroTripsLogo variant="onDark" size="sm" withWordmark />
        <nav className="flex items-center gap-2">
          <a
            href="#features"
            className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:inline"
          >
            Funcionalidades
          </a>
          <a
            href="#how"
            className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:inline"
          >
            Cómo funciona
          </a>
          <a
            href="#pricing"
            className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:inline"
          >
            Precios
          </a>
          {hasAgency ? (
            <Link
              href="/agency"
              className="inline-flex min-h-9 items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-100"
            >
              Ir al panel
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login?mode=agency&next=/agency/setup"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                Iniciar sesión
              </Link>
              <Link
                href={isLoggedIn ? "/agency/setup" : "/auth/login?mode=agency&next=/agency/setup"}
                className="inline-flex min-h-9 items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-100"
              >
                Crear agencia
              </Link>
            </>
          )}
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="text-xs font-medium text-white/40 transition hover:text-white/70"
          >
            {APP_NAME} personal
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero({ hasAgency, isLoggedIn }: { hasAgency: boolean; isLoggedIn: boolean }) {
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = Math.min(window.scrollY * 0.12, 80);
      setParallaxY(y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#162d4d] to-[#0f2744] px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-[0.07] transition-transform duration-75 will-change-transform"
        style={{
          background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
          transform: `translate3d(0, ${parallaxY}px, 0)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 h-[320px] w-[320px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal variant="fade">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {KAVIRO_TRIPS_PRODUCT_NAME} · Para agencias y organizadores
          </span>
        </Reveal>

        <Reveal variant="slide" delay={1}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Software para agencias de viajes:{" "}
            <span
              className="bg-gradient-to-r from-sky-300 to-blue-200 bg-clip-text text-transparent"
            >
              gestión de grupos con tu marca
            </span>
          </h1>
        </Reveal>

        <Reveal variant="fade" delay={2}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Herramienta y portal cliente para tus viajes en grupo: itinerario, mapa y documentos con
            tu logo. Tus clientes abren la URL en el móvil — sin app, sin registro.
          </p>
        </Reveal>

        <Reveal variant="scale" delay={3}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {hasAgency ? (
              <Link
                href="/agency"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
              >
                Ir al panel <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <>
                <Link
                  href={isLoggedIn ? "/agency/setup" : "/auth/login?mode=agency&next=/agency/setup"}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
                >
                  Crear agencia gratis <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#how"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver cómo funciona <ChevronDown className="h-4 w-4" aria-hidden />
                </a>
              </>
            )}
          </div>
        </Reveal>

        {/* Social proof strip */}
        <Reveal variant="fade" delay={4}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-white/50">
            <span>✓ Sin contratos anuales</span>
            <span>✓ Sin límite de viajes</span>
            <span>✓ Setup en menos de 10 minutos</span>
            <span>✓ Soporte por email incluido</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProductComparison() {
  const rows = [
    {
      label: "Para quién",
      personal: "Viajeros que organizan su propio viaje en grupo",
      trips: "Agencias y organizadores profesionales",
    },
    {
      label: "Quién usa la herramienta",
      personal: "Los participantes del viaje",
      trips: "Tu equipo (editores y admins)",
    },
    {
      label: "Experiencia del cliente",
      personal: "App/web con cuenta de usuario",
      trips: "Portal público con tu marca, sin registro",
    },
    {
      label: "Diferencia clave",
      personal: "Gratis para grupos de amigos",
      trips: "Panel B2B + plantillas + branding de agencia",
    },
  ];

  return (
    <section
      id="compare"
      className="border-y border-white/8 bg-[#162d4d] px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal variant="fade">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
              ¿Viajero o agencia?
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Kaviro personal vs {KAVIRO_TRIPS_PRODUCT_NAME}
            </h2>
          </div>
        </Reveal>

        <Reveal variant="slide" delay={1}>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-3 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="px-4 py-3" />
              <div className="border-l border-white/10 px-4 py-3 text-center text-white">
                {APP_NAME} personal
              </div>
              <div className="border-l border-white/10 bg-sky-500/10 px-4 py-3 text-center text-sky-200">
                {KAVIRO_TRIPS_PRODUCT_NAME}
              </div>
            </div>
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 border-t border-white/10 text-sm"
              >
                <div className="px-4 py-3.5 font-semibold text-slate-300">{row.label}</div>
                <div className="border-l border-white/10 px-4 py-3.5 text-slate-400">
                  {row.personal}
                </div>
                <div className="border-l border-white/10 bg-sky-500/5 px-4 py-3.5 text-slate-200">
                  {row.trips}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Organizas viajes para clientes?{" "}
            <a href="#contact" className="font-semibold text-sky-400 underline hover:text-sky-300">
              Solicita acceso a {KAVIRO_TRIPS_PRODUCT_NAME}
            </a>
            . ¿Viajas con amigos?{" "}
            <Link href="/" className="font-semibold text-sky-400 underline hover:text-sky-300">
              Usa {APP_NAME} personal gratis
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: <LayoutDashboard className="h-5 w-5 text-sky-200" />,
    bg: "bg-sky-900/40",
    title: "Panel centralizado",
    desc: "Todos tus viajes en un solo lugar. Filtra por estado, asigna al equipo y accede a cualquier programa en un clic.",
  },
  {
    icon: <Globe className="h-5 w-5 text-emerald-200" />,
    bg: "bg-emerald-900/40",
    title: "Portal cliente con tu marca",
    desc: "URL pública con tu logo y colores. Tus clientes ven el itinerario, el mapa y los documentos. Sin registro, desde el móvil.",
  },
  {
    icon: <LayoutTemplate className="h-5 w-5 text-violet-200" />,
    bg: "bg-violet-900/40",
    title: "Plantillas reutilizables",
    desc: "Guarda tu itinerario Chicago NFL o NYC NBA como plantilla. La próxima temporada, un clic y está listo para el nuevo grupo.",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-amber-200" />,
    bg: "bg-amber-900/40",
    title: "IA que entiende dossiers",
    desc: "Sube el PDF del programa de tu agencia y la IA crea todas las actividades del itinerario. Con horarios, ubicaciones y tipo de actividad.",
  },
  {
    icon: <Users className="h-5 w-5 text-pink-200" />,
    bg: "bg-pink-900/40",
    title: "Equipo con roles",
    desc: "Invita a tu equipo. Roles de admin y editor. Cada miembro accede al panel completo de la agencia. Logs de actividad incluidos.",
  },
  {
    icon: <Wallet className="h-5 w-5 text-teal-200" />,
    bg: "bg-teal-900/40",
    title: "Gastos del grupo",
    desc: "Registra los gastos compartidos del grupo. Balances automáticos y settlements. Tus clientes saben quién debe qué sin WhatsApp.",
  },
  {
    icon: <Palette className="h-5 w-5 text-rose-200" />,
    bg: "bg-rose-900/40",
    title: "Branding completo",
    desc: "Logo, color de marca y email de contacto. Aplicado en el portal cliente, el PDF del itinerario y los emails enviados a los viajeros.",
  },
  {
    icon: <CalendarDays className="h-5 w-5 text-cyan-200" />,
    bg: "bg-cyan-900/40",
    title: "Plan día a día visual",
    desc: "El plan del viaje organizado por días, con horarios, mapas, tipos de actividad y notas internas para el equipo.",
  },
] as const;

function Features() {
  return (
    <section
      id="features"
      className="bg-[#0f2744] px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal variant="fade">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
              Funcionalidades
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Herramienta de gestión de viajes en grupo para agencias
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Portal cliente, plantillas operativas e IA para dossiers — pensado para quien gestiona
              varios grupos al año sin hojas de cálculo.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} variant="slide" delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="rounded-xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/6">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Crea tu agencia en minutos",
      desc: "Nombre, logo y color. Invita a tu equipo con un email. El panel Kaviro Trips queda listo en menos de 10 minutos.",
      detail: "Sin instalaciones, sin configuraciones complejas.",
    },
    {
      num: "02",
      title: "Prepara el viaje (o impórtalo con IA)",
      desc: "Crea el itinerario manualmente o sube el PDF de tu programa y la IA extrae todos los días, horarios y actividades automáticamente.",
      detail: "Funciona con cualquier formato de dossier.",
    },
    {
      num: "03",
      title: "Comparte el portal con tus clientes",
      desc: "Un clic publica el portal. Tus clientes reciben la URL y ven el programa completo con tu logo, en su móvil, sin registrarse.",
      detail: "kaviro.app/client/tu-agencia/nombre-del-viaje",
    },
  ];

  return (
    <section id="how" className="bg-gradient-to-b from-[#0f2744] to-[#1e3a5f] px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal variant="fade">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Operativo en menos de 10 minutos
            </h2>
          </div>
        </Reveal>

        <div className="relative grid gap-0 md:grid-cols-3">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block"
          />

          {steps.map((s, i) => (
            <Reveal key={s.num} variant="slide" delay={i as 0 | 1 | 2}>
              <div className="relative px-4 pb-10 text-center md:pb-0">
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-500/40 bg-[#1e3a5f] shadow-lg">
                  <span className="text-lg font-black text-sky-300">{s.num}</span>
                </div>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                <p className="mt-2 text-xs font-medium text-sky-500/70">{s.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoIsItFor() {
  const audiences = [
    {
      icon: <Trophy className="h-5 w-5 text-amber-200" />,
      bg: "bg-amber-900/40",
      title: "Agencias especializadas",
      desc: "Deportivos, aventura, culturales: programas complejos con muchas actividades y horarios.",
    },
    {
      icon: <MapPin className="h-5 w-5 text-emerald-200" />,
      bg: "bg-emerald-900/40",
      title: "DMC y receptivos",
      desc: "Operadores locales que entregan el itinerario final al cliente o agencia madre con su marca.",
    },
    {
      icon: <Briefcase className="h-5 w-5 text-sky-200" />,
      bg: "bg-sky-900/40",
      title: "Empresa y team building",
      desc: "Organizadores de viajes corporativos que necesitan un portal claro para cada grupo.",
    },
  ];

  return (
    <section className="bg-[#1e3a5f] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal variant="fade">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
              Público objetivo
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Para quién es {KAVIRO_TRIPS_PRODUCT_NAME}?
            </h2>
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map((a, i) => (
            <Reveal key={a.title} variant="slide" delay={i as 0 | 1 | 2}>
              <div className="h-full rounded-xl border border-white/10 bg-white/5 p-6">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${a.bg}`}>
                  {a.icon}
                </div>
                <h3 className="text-base font-bold text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudy() {
  return (
    <section className="bg-[#1e3a5f] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal variant="fade">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="grid md:grid-cols-2">
              {/* Left — content */}
              <div className="p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">
                  Caso de uso
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Stripes Sports Trips
                </h2>
                <p className="mt-1 text-sm font-medium text-sky-300">
                  Agencia de viajes deportivos · Sports trips since 2013
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Stripes organiza viajes a la NFL, NBA, F1 y maratones desde 2013. Con Kaviro
                  Trips, cada grupo de viajeros recibe un portal con el programa completo — vuelos,
                  excursiones, partidos, hoteles — accesible desde el móvil sin necesidad de
                  registrarse.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Su equipo prepara el itinerario importando el PDF del programa con la IA. En
                  minutos el portal está listo para 14 viajeros con el logo azul marino de Stripes.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <CountUpStat
                    value={30}
                    label="actividades/viaje"
                    valueClassName="text-2xl font-bold tabular-nums text-sky-300"
                    labelClassName="text-xs text-slate-400"
                    className=""
                  />
                  <CountUpStat
                    value={14}
                    label="viajeros/grupo"
                    valueClassName="text-2xl font-bold tabular-nums text-sky-300"
                    labelClassName="text-xs text-slate-400"
                    className=""
                  />
                  <CountUpStat
                    value={5}
                    prefix="<"
                    suffix=" min"
                    label="para publicar el portal"
                    valueClassName="text-2xl font-bold tabular-nums text-sky-300"
                    labelClassName="text-xs text-slate-400"
                    className=""
                  />
                </div>
                <div className="mt-7 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Resultado típico
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Los viajeros consultan el programa de Chicago en el móvil con el branding de
                    Stripes, en lugar de PDFs sueltos por email.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Ejemplo representativo basado en el flujo operativo de la agencia.
                  </p>
                </div>
              </div>

              {/* Right — portal preview mockup */}
              <div className="flex items-center justify-center border-t border-white/10 bg-[#0f2744]/50 p-8 md:border-l md:border-t-0">
                <div
                  className="w-full max-w-xs overflow-hidden rounded-xl border border-white/15 bg-[#1e3a5f] shadow-xl"
                  role="img"
                  aria-label="Vista previa del portal cliente de Stripes Sports Trips con actividades del viaje a Chicago y Lambeau Field"
                >
                  {/* Portal header */}
                  <div className="flex items-center gap-3 bg-[#0A3D6B] px-4 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[8px] font-black text-[#0A3D6B]">
                      STR
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white">Stripes Sports Trips</div>
                      <div className="text-[9px] text-white/60">Chicago & Lambeau Field 2026</div>
                    </div>
                  </div>
                  {/* Portal content */}
                  <div className="space-y-2 p-4">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 w-10 flex-shrink-0 text-[9px] font-bold text-red-300">07:00</span>
                        <div>
                          <div className="text-[10px] font-bold text-white">Salida a Green Bay</div>
                          <div className="text-[9px] text-slate-400">Bus privado Stripes</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 w-10 flex-shrink-0 text-[9px] font-bold text-red-300">15:25</span>
                        <div>
                          <div className="text-[10px] font-bold text-white">🏈 Bears AT Packers</div>
                          <div className="text-[9px] text-slate-400">Lambeau Field · NFL Week 5</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 w-10 flex-shrink-0 text-[9px] font-bold text-red-300">19:30</span>
                        <div>
                          <div className="text-[10px] font-bold text-white">Regreso a Chicago</div>
                          <div className="text-[9px] text-slate-400">Bus privado</div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-1 text-center text-[8px] text-slate-500">
                      Vista de solo lectura · hola@stripes.es
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Pricing({ isLoggedIn }: { isLoggedIn: boolean }) {
  const features = [
    "Panel centralizado de todos los viajes",
    "Plantillas operativas reutilizables",
    "Portal cliente con tu marca y colores",
    "Hasta 5 miembros del equipo",
    "Importación de documentos con IA",
    "Anuncios y comunicación a clientes",
    "Informes de temporada",
    "Soporte por email",
  ];

  return (
    <section id="pricing" className="bg-[#0f2744] px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal variant="fade">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">Precios</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Simple y sin sorpresas
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
              Empieza con 14 días de prueba gratis. Agency Pro por suscripción o partnership para
              operaciones grandes.
            </p>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={1}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#1e3a5f] to-[#162d4d] shadow-xl">
              <div className="p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Prueba gratuita</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">14 días</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">2 miembros · sin tarjeta</p>
                <ul className="mt-5 space-y-2">
                  {features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={isLoggedIn ? "/agency/setup" : "/auth/login?mode=agency&next=/agency/setup"}
                  className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#1e3a5f] shadow-md transition hover:bg-slate-100"
                >
                  Crear agencia <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#1e3a5f] to-[#162d4d] shadow-xl">
              <div className="grid h-full md:grid-cols-1">
                <div className="p-8 sm:p-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Agency Pro</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">Mensual</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">Tarifa mensual acordada por agencia · pago con Stripe</p>
                  <ul className="mt-5 space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={isLoggedIn ? "/agency/plan" : "/auth/login?mode=agency&next=/agency/plan"}
                    className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Ver plan y pagar
                  </Link>
                  <a
                    href={agencyPartnershipMailto()}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-400 underline hover:text-slate-200"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Partnership para volumen alto
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Comparison strip */}
        <Reveal variant="fade" delay={2}>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              ¿Eres un viajero particular?{" "}
              <Link href="/" className="font-semibold text-sky-400 underline hover:text-sky-300">
                Kaviro personal es gratis
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "¿Mis clientes necesitan descargarse una app?",
      a: "No. El portal cliente es una URL pública. Tus clientes abren el enlace en el navegador de su móvil y ven el itinerario completo. Sin registro, sin descarga.",
    },
    {
      q: "¿Qué pasa si actualizo el itinerario después de publicarlo?",
      a: "Los cambios se reflejan en el portal en tiempo real. La próxima vez que tu cliente abra la URL verá la versión actualizada. También puedes añadir anuncios para avisar de cambios.",
    },
    {
      q: "¿Puedo usar mi propio logo y colores?",
      a: "Sí. En la configuración de branding subes tu logo (PNG o SVG) y defines el color principal en hexadecimal. Ese color se aplica en el portal cliente, el PDF exportable y los emails.",
    },
    {
      q: "¿Cuántos miembros puede tener mi equipo?",
      a: "El plan base incluye hasta 5 miembros. Si necesitas más, cuéntanoslo al solicitar el acceso y lo ajustamos.",
    },
    {
      q: "¿Cómo funciona la importación de documentos con IA?",
      a: "Subes un PDF o imagen de tu programa (dossier de la agencia, tabla de actividades, horarios). La IA extrae todos los días, horarios, lugares y tipos de actividad y crea las tarjetas del itinerario automáticamente. Funciona con cualquier formato.",
    },
    {
      q: "¿Kaviro Trips es diferente de Kaviro personal?",
      a: "Sí. Kaviro personal es para viajeros que organizan sus propios viajes en grupo. Kaviro Trips es para agencias y organizadores profesionales que gestionan viajes de clientes. Los usuarios del panel de agencia también pueden acceder a Kaviro personal con la misma cuenta.",
    },
  ];

  return (
    <section className="bg-[#1e3a5f] px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal variant="fade">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Preguntas frecuentes
            </h2>
          </div>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} variant="slide" delay={(i % 3) as 0 | 1 | 2}>
              <details className="group rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white list-none">
                  {faq.q}
                  <ChevronDown
                    className="h-4 w-4 flex-shrink-0 text-sky-400 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ hasAgency }: { hasAgency: boolean }) {
  if (hasAgency) return null;

  return (
    <section id="contact" className="bg-gradient-to-b from-[#1e3a5f] to-[#0f2744] px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal variant="fade">
          <Building2 className="mx-auto mb-5 h-10 w-10 text-sky-400" aria-hidden />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Empieza hoy con tu agencia
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
            Cuéntanos el nombre de tu agencia, cuántos viajes gestionas al año y el tamaño de tu
            equipo. Te damos acceso en menos de 24 horas.
          </p>
        </Reveal>

        <Reveal variant="scale" delay={1}>
          <EmpresaContactForm />
        </Reveal>
      </div>
    </section>
  );
}

function Footer({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <footer className="border-t border-white/10 bg-[#0f2744] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <KaviroTripsLogo variant="onDark" size="sm" withWordmark />
            <p className="mt-2 text-xs text-slate-500">
              Herramienta profesional para agencias y organizadores de viajes.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link href="/" className="transition hover:text-white">
              {APP_NAME} personal
            </Link>
            <Link href="/pricing" className="transition hover:text-white">
              Precios personales
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacidad
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Términos
            </Link>
            {isLoggedIn ? (
              <Link href="/agency" className="font-semibold text-sky-400 transition hover:text-sky-300">
                Ir al panel
              </Link>
            ) : (
              <Link
                href="/auth/login?mode=agency&next=/agency"
                className="font-semibold text-sky-400 transition hover:text-sky-300"
              >
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
        <div className="mt-8 border-t border-white/8 pt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Kaviro · kaviro.app
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function EmpresaLanding({ hasAgency, isLoggedIn, reason }: Props) {
  return (
    <div className={`${KAVIRO_TRIPS_WORKSPACE_CLASS}`}>
      {reason === "no-membership" && isLoggedIn && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-center text-sm text-amber-200">
          Crea tu agencia en un minuto o{" "}
          <Link href="/agency/setup" className="font-bold underline">
            continúa el registro
          </Link>
          . ¿Volumen alto?{" "}
          <a href={agencyPartnershipMailto()} className="font-bold underline">
            {AGENCY_PARTNERSHIP_EMAIL}
          </a>
        </div>
      )}
      <NavBar hasAgency={hasAgency} isLoggedIn={isLoggedIn} />
      <Hero hasAgency={hasAgency} isLoggedIn={isLoggedIn} />
      <ProductComparison />
      <Features />
      <HowItWorks />
      <WhoIsItFor />
      <CaseStudy />
      <Pricing isLoggedIn={isLoggedIn} />
      <FAQ />
      <Contact hasAgency={hasAgency} />
      <Footer isLoggedIn={isLoggedIn} />
    </div>
  );
}
