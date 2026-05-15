import type { TourStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

/** Recorrido demo: mismas pestañas que TAB_TOUR, copy orientado al viaje de Londres. */
export const DEMO_TAB_TOUR: TourStep[] = [
  {
    id: "home",
    title: "Resumen",
    lead: "Paso 1 de 7",
    body: "Vista general del viaje demo a Londres: fechas, accesos rápidos y el estado del grupo.",
    mobileTip: "En móvil, el menú inferior lleva a cada sección.",
    href: (id) => `/trip/${id}/summary`,
    visual: { type: "image", tabKey: "summary", alt: "Resumen" },
  },
  {
    id: "plan",
    title: "Plan",
    lead: "Paso 2 de 7",
    body: "Itinerario de ejemplo: museos, mercado y West End. Así veréis el plan compartido en un viaje real.",
    mobileTip: "Las actividades están ordenadas por día y hora.",
    href: (id) => `/trip/${id}/plan`,
    visual: { type: "image", tabKey: "plan", alt: "Plan" },
  },
  {
    id: "map",
    title: "Rutas",
    lead: "Paso 3 de 7",
    body: "Trayectos sobre el mapa. En este demo hay una ruta de paseo por el centro.",
    mobileTip: "Podéis crear rutas a pie, en coche o transporte.",
    href: (id) => `/trip/${id}/map`,
    visual: { type: "image", tabKey: "map", alt: "Rutas" },
  },
  {
    id: "expenses",
    title: "Gastos",
    lead: "Paso 4 de 7",
    body: "Gastos en GBP, EUR y USD. La moneda base del viaje es la libra (GBP); los balances convierten al resto. Probá el conversor abajo del listado.",
    mobileTip: "Ideal para cenas, entradas y transporte sin pelearos con Excel.",
    href: (id) => `/trip/${id}/expenses`,
    visual: { type: "image", tabKey: "expenses", alt: "Gastos" },
  },
  {
    id: "participants",
    title: "Gente",
    lead: "Paso 5 de 7",
    body: "Ana, Luis y María son participantes de ejemplo. En tu viaje invitarás a familia o amigos con enlace.",
    mobileTip: "Podéis definir quién edita plan, gastos o solo mira.",
    href: (id) => `/trip/${id}/participants`,
    visual: { type: "image", tabKey: "participants", alt: "Participantes" },
  },
  {
    id: "resources",
    title: "Docs",
    lead: "Paso 6 de 7",
    body: "Reservas, billetes y documentos del viaje. Aquí podéis guardar PDFs y datos de alojamiento.",
    mobileTip: "Premium puede analizar tickets automáticamente.",
    href: (id) => `/trip/${id}/resources`,
    visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass },
  },
  {
    id: "ai",
    title: "Asistente",
    lead: "Paso 7 de 7",
    body: "Asistente personal del viaje (Premium): itinerarios y dudas con contexto. En el plan gratuito el resto de Kaviro sigue disponible.",
    mobileTip: "No es obligatorio para organizar el viaje en grupo.",
    href: (id) => `/trip/${id}/ai-chat`,
    visual: { type: "image", tabKey: "chat", alt: "Asistente" },
  },
];
