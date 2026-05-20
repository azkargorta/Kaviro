/**
 * Copy y listas para landing /pricing — alineado con lib/tier.ts y premium-copy.
 */
import { PLAN_LIMITS } from "@/lib/tier";
import { FREE_TRIP_LIMIT } from "@/lib/premium-copy";

const free = PLAN_LIMITS.free;

/** Importes mostrados en la web (deben coincidir con los Price creados en Stripe). */
export const PRICING_PRICES = {
  monthly: "3,99€",
  yearly: "39,99€",
  yearlyNote: "2 meses gratis",
} as const;

export const PRICING_PRICE_LABELS = {
  monthly: `${PRICING_PRICES.monthly} / mes`,
  yearly: `${PRICING_PRICES.yearly} / año`,
} as const;

export const FREE_PLAN_FEATURES = [
  { key: "trips", text: `Hasta ${free.trips} viajes (sin contar el demo)` },
  { key: "participants", text: `Hasta ${free.participantsPerTrip} participantes por viaje` },
  { key: "plan", text: "Plan del viaje con mapa y rutas manuales" },
  { key: "expenses", text: "Gastos, balances y export CSV" },
  { key: "docs", text: "Documentos, reservas y listas compartidas" },
  { key: "share", text: "Compartir viaje con enlace" },
  { key: "places", text: "Autocompletar de lugares" },
  { key: "export", text: "Exportar PDF e .ics" },
] as const;

export const PREMIUM_PLAN_FEATURES: Array<{ key: string; text: string; highlight?: boolean }> = [
  { key: "ai", text: "Asistente IA personal del viaje", highlight: true },
  { key: "ocr", text: "Analizar tickets y documentos con IA", highlight: true },
  { key: "routes", text: "Rutas automáticas generadas con IA" },
  { key: "itinerary", text: "Itinerarios completos en un clic" },
  { key: "trips", text: "Viajes ilimitados" },
  { key: "support", text: "Soporte prioritario" },
];

export const PRICING_COMPARISON_ROWS = [
  { feature: "Viajes activos", free: `${free.trips} máx.`, premium: "Ilimitados" },
  { feature: "Participantes por viaje", free: `${free.participantsPerTrip}`, premium: "Sin límite práctico" },
  { feature: "Plan del viaje y actividades", free: true, premium: true },
  { feature: "Mapa, rutas y navegación", free: true, premium: true },
  { feature: "Gastos y balances de grupo", free: true, premium: true },
  { feature: "Documentos y reservas (subida manual)", free: true, premium: true },
  { feature: "Exportar PDF e .ics", free: true, premium: true },
  { feature: "Asistente IA personal", free: false, premium: true },
  { feature: "Análisis de tickets/documentos con IA", free: false, premium: true },
  { feature: "Rutas automáticas con IA", free: false, premium: true },
] as const;

export const PRICING_FAQ = [
  {
    q: "¿Qué incluye el plan gratuito?",
    a: `Puedes crear hasta ${FREE_TRIP_LIMIT} viajes, invitar hasta ${free.participantsPerTrip} personas por viaje y usar plan, mapa, gastos y documentos sin pagar. El asistente IA y el análisis automático de archivos son Premium.`,
  },
  {
    q: "¿Las rutas y el mapa están incluidos en el plan gratuito?",
    a: "Sí. Puedes crear rutas manualmente, usar el mapa interactivo, autocompletar lugares y exportar el itinerario a PDF o calendario.",
  },
  {
    q: "¿Qué desbloquea exactamente Premium?",
    a: "El asistente IA que conoce tu viaje, el analizador de documentos (extrae datos de reservas y tickets) y la generación automática de rutas e itinerarios.",
  },
  {
    q: "¿Un participante Premium activa IA para todo el viaje?",
    a: "Sí. Si alguien del grupo tiene Premium, las funciones IA quedan disponibles para ese viaje aunque tú no tengas suscripción.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin penalización. Cancelas desde tu cuenta y Premium sigue activo hasta el final del período pagado.",
  },
  {
    q: "¿El plan Premium es por persona o por viaje?",
    a: "Es por cuenta. Con Premium organizas todos los viajes que quieras con IA activada en los viajes donde aplica.",
  },
] as const;
