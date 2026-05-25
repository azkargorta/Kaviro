/**
 * Mensajes y copy unificados para plan gratuito vs Premium.
 * Usar en UI y respuestas API para coherencia (P0 auditoría).
 */
import { PLAN_LIMITS, PREMIUM_REQUIRED } from "@/lib/tier";

export { PLAN_LIMITS, PREMIUM_REQUIRED };

export const FREE_TRIP_LIMIT = PLAN_LIMITS.free.trips;

export function freeTripLimitMessage() {
  return `El plan gratuito permite hasta ${FREE_TRIP_LIMIT} viajes. Hazte Premium para crear más viajes.`;
}

export function premiumRequiredMessage(feature = "esta función") {
  return `Necesitas Premium para usar ${feature}.`;
}

export function freePlanBanner() {
  return `Plan gratuito: hasta ${FREE_TRIP_LIMIT} viajes. Premium desbloquea el asistente personal y el análisis de documentos.`;
}

export function freePlanBadge() {
  return `Plan gratuito · hasta ${FREE_TRIP_LIMIT} viajes`;
}

export {
  PREMIUM_ACCOUNT_QUERY,
  PREMIUM_UPGRADE_HREF,
  PREMIUM_UPGRADE_LOGIN_HREF,
  buildBillingCheckoutHref,
  buildLoginHref,
  buildPremiumCheckoutLoginHref,
} from "@/lib/auth-routes";

export type PremiumFeatureKey =
  | "generic"
  | "aiAssistant"
  | "documentAnalyzer"
  | "expenseOcr"
  | "autoRoutes"
  | "aiInsights";

export const PREMIUM_FEATURE_COPY: Record<
  PremiumFeatureKey,
  { title: string; description: string }
> = {
  generic: {
    title: "Función Premium",
    description: premiumRequiredMessage("esta función"),
  },
  aiAssistant: {
    title: "Asistente personal del viaje",
    description:
      "Planifica con IA, memoria del viaje, acciones automáticas y optimización del itinerario.",
  },
  documentAnalyzer: {
    title: "Análisis de documentos",
    description:
      "Sube PDFs o imágenes de reservas y tickets; rellenamos formularios de alojamiento, transporte y actividades.",
  },
  expenseOcr: {
    title: "Análisis de tickets de gasto",
    description:
      "En el plan gratuito puedes registrar y dividir gastos; el análisis automático de PDF/imagen requiere Premium.",
  },
  autoRoutes: {
    title: "Rutas automáticas",
    description:
      "Genera un borrador de rutas entre tus planes (por día o todo el viaje) y revísalas antes de guardar.",
  },
  aiInsights: {
    title: "Brief y maleta con IA",
    description: "Brief del destino y lista de equipaje generados según tu viaje y actividades.",
  },
};

/** Mensaje cuando el premium puede venir de otro participante del viaje. */
export function tripPremiumCoopHint() {
  return "Si alguien del grupo tiene Premium, estas funciones quedan activas para todo el viaje.";
}
