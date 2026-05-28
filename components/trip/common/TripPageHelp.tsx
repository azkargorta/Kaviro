"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useIsDemoTrip } from "@/components/trip/TripDemoContext";
import { DEMO_TAB_TOUR, DEMO_SPOTLIGHT_TOUR } from "@/lib/onboarding/demo-tour-copy";
import SpotlightTour from "@/components/trip/common/SpotlightTour";
import type { TourStep } from "@/components/trip/common/trip-tour-types";
import { LifeBuoy } from "lucide-react";
import { getTripTabIconSrc, tripTabDocsImageClass, tripTabIconCoralFilterDark, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

type HelpBlock = { heading: string; bullets: string[] };

type HelpEntry = {
  title: string;
  intro: string;
  blocks: HelpBlock[];
};

function tourStorageKey(tripId: string) {
  return `tripboard_trip_tabs_tour_v1:${tripId}`;
}

/** Primera vez que se muestra la ayuda detallada de esta pantalla (independiente del recorrido por pestañas). */
function pageHelpSeenKey(tripId: string, pageId: string) {
  return `tripboard_trip_page_help_seen_v2:${tripId}:${pageId}`;
}

function readPageHelpSeen(tripId: string, pageId: string) {
  try {
    return window.localStorage.getItem(pageHelpSeenKey(tripId, pageId)) === "1";
  } catch {
    return true;
  }
}

function markPageHelpSeen(tripId: string, pageId: string) {
  try {
    window.localStorage.setItem(pageHelpSeenKey(tripId, pageId), "1");
  } catch {
    /* */
  }
}

function getTripPageHelpId(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "trip" || parts.length < 2) return null;
  const rest = parts.slice(2);
  if (rest.length === 0 || rest[0] === "overview") return "home";
  const seg = rest[0];
  if (seg === "summary") return "home";
  if (seg === "plan") return "plan";
  if (seg === "map") return "map";
  if (seg === "expenses") return "expenses";
  if (seg === "participants") return "participants";
  if (seg === "resources") return "resources";
  if (seg === "ai-chat" || seg === "ai") return "ai";
  if (seg === "settings") return "settings";
  return null;
}

const TAB_TOUR: TourStep[] = [
  {
    id: "home",
    title: "Resumen",
    lead: "Paso 1 de 7",
    body: "Resumen del viaje: destino, fechas, accesos rápidos a cada módulo y avisos útiles para el grupo.",
    mobileTip: "Abajo tienes el menú con todas las pestañas; desliza horizontalmente si no caben en pantalla.",
    href: (id) => `/trip/${id}/summary`,
    visual: { type: "image", tabKey: "summary", alt: "Resumen" },
  },
  {
    id: "plan",
    title: "Plan",
    lead: "Paso 2 de 7",
    body: "Itinerario coral por días: actividades compactas, IA sugiere, visibilidad por actividad y RSVP del grupo.",
    mobileTip: "Usa las pestañas del itinerario para cambiar de día; pulsa una fila para ver detalle y reacciones.",
    href: (id) => `/trip/${id}/plan`,
    visual: { type: "image", tabKey: "plan", alt: "Plan" },
  },
  {
    id: "map",
    title: "Rutas",
    lead: "Paso 3 de 7",
    body: "Rutas y trayectos del viaje sobre el mapa: paradas, orden del día y vistas para explorar el entorno o ver el plan georreferenciado.",
    mobileTip: "Gestos de pellizco para zoom; los paneles laterales o inferiores se pueden deslizar o cerrar.",
    href: (id) => `/trip/${id}/map`,
    visual: { type: "image", tabKey: "map", alt: "Rutas" },
  },
  {
    id: "expenses",
    title: "Gastos",
    lead: "Paso 4 de 7",
    body: "Quién pagó qué, cómo repartirlo y balances para saldar cuentas sin líos al final del viaje.",
    mobileTip: "Mira primero el resumen arriba; el detalle de cada gasto va debajo en lista o tabla.",
    href: (id) => `/trip/${id}/expenses`,
    visual: { type: "image", tabKey: "expenses", alt: "Gastos" },
  },
  {
    id: "participants",
    title: "Gente",
    lead: "Paso 5 de 7",
    body: "Participantes, invitaciones y permisos. Cuanto mejor definido esté el grupo, mejor cuadran plan y gastos.",
    mobileTip: "Usa el mismo nombre en gastos que en participantes para que los balances te reconozcan bien.",
    href: (id) => `/trip/${id}/participants`,
    visual: { type: "image", tabKey: "participants", alt: "Participantes" },
  },
  {
    id: "resources",
    title: "Docs",
    lead: "Paso 6 de 7",
    body: "Billetes, reservas, PDFs y enlaces en un solo sitio para que nadie pierda el correo de confirmación.",
    mobileTip: "En móvil, enlaces y archivos se abren con el navegador; guarda lo crítico donde te sea cómodo.",
    href: (id) => `/trip/${id}/resources`,
    visual: { type: "image", tabKey: "resources", alt: "Docs", imageClassName: tripTabDocsImageClass },
  },
  {
    id: "ai",
    title: "Asistente personal",
    lead: "Paso 7 de 7",
    body: "Asistente con contexto de este viaje: ideas, organizar un día, dudas y sugerencias según el tipo de chat.",
    mobileTip: "En pantalla pequeña el chat va primero; en el panel lateral tienes conversaciones y «Mostrar tipos».",
    href: (id) => `/trip/${id}/ai-chat`,
    visual: { type: "image", tabKey: "chat", alt: "Asistente personal" },
  },
];

const HELP: Record<string, HelpEntry> = {
  home: {
    title: "Resumen del viaje",
    intro:
      "Pantalla de resumen del viaje: ves de un vistazo el destino, las fechas, el estado del plan y atajos a cada módulo.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Consultar y, si tienes permiso, editar datos básicos del viaje (nombre, destino, fechas, etc.).",
          "Ir al Plan, Rutas, Gastos, Gente, Docs o asistente personal desde las tarjetas de accesos rápidos o desde el menú inferior.",
          "Leer avisos y recordatorios (clima, datos pendientes, participantes) cuando el viaje aún está incompleto.",
          "Abrir la campana de novedades para ver cambios recientes del plan, gastos e invitaciones.",
          "Seguir el bloque «Primeros pasos» si el viaje es nuevo: enlaces directos a las tareas más habituales.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Todo el grupo comparte la misma fuente de verdad: menos mensajes sueltos y menos confusiones.",
          "Ahorras tiempo: no hace falta abrir cada módulo para saber si falta algo importante.",
          "Sirve de “tablero” antes y durante el viaje: vuelves aquí para orientarte y repartir tareas.",
        ],
      },
    ],
  },
  plan: {
    title: "Plan del viaje",
    intro:
      "La tarjeta coral del itinerario concentra el día: pestañas por fecha, actividades compactas, IA sugiere y resumen de gastos.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Navegar por días con las pestañas del itinerario y añadir actividades desde la cabecera o la barra de herramientas.",
          "Definir quién ve cada plan: todo el viaje, solo tú o participantes concretos.",
          "Pedir a IA sugiere (Premium) un análisis del itinerario con huecos y mejoras aplicables.",
          "Ver RSVP del grupo (¿Te apuntas?, No, Quizá) y valoraciones al abrir el detalle de una actividad.",
          "Exportar PDF, historial de cambios, explorar lugares en mapa y vista calendario.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Un solo plan compartido con visibilidad fina: planes privados o solo para parte del grupo.",
          "Menos improvisación: el grupo coordina asistencia y expectativas sin chats sueltos.",
          "Encaja con Rutas, Gastos y el feed de novedades: lo que cambias aquí se refleja en todo el viaje.",
        ],
      },
    ],
  },
  map: {
    title: "Rutas",
    intro:
      "Gestiona trayectos y paradas sobre el mapa: crea rutas del día, revisa el orden geográfico y abre vistas como Explorar o el plan georreferenciado.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Crear rutas manualmente con «Nueva ruta» o abrir «Crear rutas automáticamente» (Premium) para un borrador con IA.",
          "Ver en el mapa rutas, puntos y tramos ligados a este viaje.",
          "Comprobar distancias y orden geográfico de las paradas respecto al plan del día.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Entiendes de un vistazo si el día es realista (tiempos de desplazamiento, lejanía de puntos).",
          "Evitas discusiones del tipo “¿esto queda lejos?”: la respuesta está en el mapa.",
          "Complementa el Plan: lo que escribiste en agenda cobra sentido sobre el terreno.",
        ],
      },
    ],
  },
  expenses: {
    title: "Gastos",
    intro:
      "Lleva la contabilidad del viaje: quién paga, cómo se reparte y cuánto debe cada uno al resto del grupo.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Registrar gastos con importe, moneda y quién participó en cada pago o consumo.",
          "Ver balances y resúmenes de quién debe a quién para saldar al final del viaje.",
          "Ajustar repartos cuando alguien adelanta dinero o paga por varios.",
          "Consultar el histórico para recordar un gasto concreto o revisar el total por categoría.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Transparencia total: nadie tiene que llevar la cuenta en un Excel aparte.",
          "Menos fricción social: las cifras hablan y el reparto es justo y revisable.",
          "Útil en viajes largos o con mucha gente: el saldo se mantiene claro día a día.",
        ],
      },
    ],
  },
  participants: {
    title: "Gente",
    intro: "Define quién viaja, cómo se llama en la app y qué puede hacer cada persona respecto al viaje.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Añadir o revisar participantes y roles (quién organiza, quién solo consulta, etc., según permisos).",
          "Invitar por WhatsApp, enlace, QR o compañeros de viaje (Travel Mates) para unirse al mismo viaje.",
          "Alinear nombres con los que usarás en Gastos para que los balances te reconozcan bien.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Menos errores en repartos y menciones: todos aparecen como en la vida real.",
          "Quien se une tarde entra en un contexto ya definido: no hay “versiones paralelas” del grupo.",
          "Facilita la coordinación: sabes a quién pedir cada cosa.",
        ],
      },
    ],
  },
  resources: {
    title: "Docs y recursos",
    intro: "Centraliza billetes, reservas, PDFs y enlaces para que nadie busque en el buzón a última hora.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Subir archivos o pegar enlaces a reservas, seguros, entradas o guías.",
          "Organizar la documentación del viaje en un solo sitio visible para quien tenga acceso.",
          "Recuperar rápido un PDF o enlace en aeropuerto, hotel o punto de encuentro.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Menos estrés: no dependes de reenviar el mismo correo diez veces.",
          "Historial compartido: si alguien pierde el móvil, el grupo sigue teniendo copia en la nube del viaje.",
          "Complementa el Plan: lo administrativo vive aquí, lo horario en Plan.",
        ],
      },
    ],
  },
  ai: {
    title: "Asistente personal",
    intro:
      "Un chat que conoce el contexto de este viaje: puede proponer ideas, ordenar un día o responder dudas según el modo que elijas.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Escribir preguntas o pedidos en lenguaje natural (itinerarios, alternativas, qué ver en una zona, etc.).",
          "Elegir o cambiar el tipo de conversación para que el asistente personal se enfoque en preguntar, preparar u otras tareas.",
          "Gestionar conversaciones: retomar un hilo o empezar uno nuevo cuando el tema cambie (según tu plan).",
          "Usar sugerencias rápidas como atajos cuando no sepas cómo formular la primera pregunta.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Ahorra tiempo de búsqueda: resume opciones usando los datos que ya tienes en el viaje.",
          "Sirve de “segunda opinión” creativa sin sustituir tu criterio ni las reservas reales.",
          "Encaja con Plan y Rutas: puedes pasar de la idea al calendario o al mapa con menos saltos mentales.",
        ],
      },
    ],
  },
  settings: {
    title: "Ajustes del viaje",
    intro: "Configura opciones que afectan a todo el viaje: nombre visible, permisos y otros ajustes según lo que permita la app.",
    blocks: [
      {
        heading: "Qué puedes hacer en esta página",
        bullets: [
          "Revisar y cambiar ajustes del viaje que aplican a todo el grupo (según tu rol).",
          "Comprobar preferencias antes de compartir el viaje o invitar a más gente.",
        ],
      },
      {
        heading: "Ventajas",
        bullets: [
          "Control centralizado: evitas cambiar el mismo dato en varios sitios.",
          "Quien administra el viaje puede dejarlo fino sin tocar el plan día a día.",
        ],
      },
    ],
  },
};

function readTourSeen(tripId: string) {
  try {
    return window.localStorage.getItem(tourStorageKey(tripId)) === "1";
  } catch {
    return true;
  }
}

function markTourSeen(tripId: string) {
  try {
    window.localStorage.setItem(tourStorageKey(tripId), "1");
  } catch {
    /* */
  }
}

function HelpVisualBadge({
  visual,
  size = "md",
}: {
  visual: TourStep["visual"];
  size?: "md" | "lg";
}) {
  const isDark = useIsDarkMode();
  /** Mismo tamaño en tour y en ayuda por pantalla; sin padding externo para que el pictograma llene el marco. */
  const frameClass =
    size === "lg"
      ? "h-[5.5rem] w-[5.5rem] rounded-[1.75rem]"
      : "h-20 w-20 rounded-3xl";
  const innerRound = size === "lg" ? "rounded-[1.35rem]" : "rounded-2xl";
  const fillSizes = size === "lg" ? "88px" : "80px";
  const emojiClass = size === "lg" ? "text-[3.35rem]" : "text-[2.95rem]";

  return (
    <div
      className={`relative flex shrink-0 ${frameClass} items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/90 dark:border-slate-700/60 dark:bg-slate-950/60 dark:ring-slate-700/40`}
    >
      {visual.type === "emoji" ? (
        <div
          className={`flex h-full w-full items-center justify-center ${innerRound} bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/70 dark:bg-slate-900/55 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:ring-slate-700/50`}
        >
          <span className={`${emojiClass} leading-none`} aria-hidden>
            {visual.value}
          </span>
        </div>
      ) : (
        <div className={`relative h-full w-full ${innerRound} bg-white dark:bg-slate-950/40`}>
          <Image
            src={getTripTabIconSrc(visual.tabKey, isDark)}
            alt={visual.alt}
            fill
            sizes={fillSizes}
            className={["object-contain object-center", tripTabIconCoralFilterDark, visual.imageClassName].filter(Boolean).join(" ")}
            priority={false}
          />
        </div>
      )}
    </div>
  );
}

function PageHelpVisualHeader({ pageId }: { pageId: string }) {
  if (pageId === "settings") {
    return (
      <div className="mb-5 flex flex-col items-center text-center">
        <HelpVisualBadge visual={{ type: "emoji", value: "⚙️" }} />
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)] dark:text-[var(--brand)]">
          Estás en
        </p>
        <p className="text-lg font-bold text-slate-950 dark:text-slate-50">Ajustes</p>
      </div>
    );
  }

  const step = TAB_TOUR.find((s) => s.id === pageId);
  if (!step) return null;
  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <HelpVisualBadge visual={step.visual} />
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)] dark:text-[var(--brand)]">
        Estás en
      </p>
      <p className="text-lg font-bold text-slate-950 dark:text-slate-50">{step.title}</p>
    </div>
  );
}

async function completeDemoOnboarding() {
  await fetch("/api/onboarding/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete" }),
    credentials: "include",
  });
}

/**
 * Traduce el pageId interno (usado en HELP y TAB_TOUR) al tab-key
 * que usan los pasos de DEMO_SPOTLIGHT_TOUR y SpotlightTour.
 * "home" → página de resumen/summary; "ai" → ai-chat.
 */
const PAGE_TO_SPOTLIGHT_TAB: Record<string, string> = {
  home: "summary",
  ai: "ai-chat",
};

export default function TripPageHelp({ heroMode = false }: { heroMode?: boolean } = {}) {
  const pathname = usePathname();
  const params = useParams();
  const isDemoTrip = useIsDemoTrip();
  const tripId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const activeTour = isDemoTrip ? DEMO_TAB_TOUR : TAB_TOUR;

  const pageId = useMemo(() => {
    if (!tripId) return null;
    return getTripPageHelpId(pathname);
  }, [pathname, tripId]);

  const entry = pageId ? HELP[pageId] : null;

  const searchParams = useSearchParams();
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openManual = useCallback(() => {
    setSpotlightOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cierra el spotlight al cambiar de página (solo viajes normales;
  // en el demo el propio SpotlightTour navega entre tabs y debe seguir abierto).
  useEffect(() => {
    if (isDemoTrip) return;
    setSpotlightOpen(false);
  }, [pathname, isDemoTrip]);

  // Auto-open spotlight when arriving from ?tutorial=demo (onboarding nuevo usuario)
  useEffect(() => {
    if (!mounted) return;
    if (searchParams?.get("tutorial") !== "demo") return;
    if (spotlightOpen) return;
    const t = window.setTimeout(() => {
      setSpotlightOpen(true);
    }, 600);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams]);

  // Evita mismatch SSR/CSR: `usePathname/useParams` pueden diferir en el render del servidor.
  if (!mounted || !tripId || !pageId || !entry) return null;

  return (
    <>
      {heroMode ? (
        <button
          type="button"
          onClick={openManual}
          data-tour="topbar-help"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white transition hover:bg-white/30"
          aria-label={`Ayuda: ${entry.title}`}
          title={`Ayuda: ${entry.title}`}
        >
          <LifeBuoy className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={openManual}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/40"
          aria-label={`Ayuda: ${entry.title}`}
          title={`Ayuda de ${entry.title}`}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-50">
            <LifeBuoy className="h-5 w-5 text-[var(--brand)]" aria-hidden />
          </span>
          <span className="flex flex-col items-start gap-0 leading-tight">
            <span className="text-[8px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-400">Ayuda</span>
            <span className="leading-none">
              {activeTour.find((s) => s.id === pageId)?.title ?? entry.title}
            </span>
          </span>
        </button>
      )}

      {/* Spotlight — demo: recorrido completo cross-tab | normal: solo pasos de la pestaña actual */}
      {mounted && spotlightOpen && tripId && pageId && (
        <SpotlightTour
          steps={DEMO_SPOTLIGHT_TOUR}
          tripId={tripId}
          currentTab={PAGE_TO_SPOTLIGHT_TAB[pageId] ?? pageId}
          filterToTab={!isDemoTrip}
          onClose={() => setSpotlightOpen(false)}
          onComplete={() => setSpotlightOpen(false)}
        />
      )}
      {/* Botón de tour rápido, solo en el viaje demo */}
      {isDemoTrip && !spotlightOpen && pageId && (
        <button
          type="button"
          onClick={() => setSpotlightOpen(true)}
          className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#F87171]/30 bg-[#F87171]/10 px-4 text-[10px] font-semibold text-[#F87171] shadow-sm transition hover:bg-[#F87171]/20 ${heroMode ? "hidden sm:inline-flex" : ""}`}
          aria-label="Tour de esta pestaña"
        >
          <span className="text-sm">🗺️</span>
          <span>Tour</span>
        </button>
      )}
    </>
  );
}
