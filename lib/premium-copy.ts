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
