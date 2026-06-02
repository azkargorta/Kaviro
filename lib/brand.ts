/**
 * Marca pública de la aplicación.
 * El repositorio puede llamarse TripBoard (legado); el producto visible es Kaviro.
 */
export const APP_NAME = "Kaviro" as const;

export const APP_TAGLINE = "Organiza viajes, gastos y rutas" as const;

export const APP_DESCRIPTION_SHORT = "Organiza tu viaje, rutas, gastos y documentos" as const;

export const APP_DOMAIN = "kaviro.app" as const;

/** Contacto legal y privacidad (RGPD). */
export const LEGAL_CONTACT_EMAIL = "hola@kaviro.app" as const;

/** Contacto para agencias que quieren usar Kaviro en modo empresa. */
export const AGENCY_PARTNERSHIP_EMAIL = LEGAL_CONTACT_EMAIL;

export const LEGAL_CONTROLLER_LABEL = "Kaviro (responsable del tratamiento)" as const;

export const APP_MARKETING_TITLE = `${APP_NAME} — Organiza viajes en grupo sin esfuerzo` as const;

export const APP_MARKETING_DESCRIPTION =
  "Plan del viaje, gastos compartidos, mapa de rutas y asistente IA. Todo en un solo lugar para que tu grupo viaje sin líos." as const;

/** Prefijo estable para claves de localStorage/sessionStorage (no cambiar sin migración). */
export const STORAGE_KEY_PREFIX = "kaviro" as const;

export function agencyPartnershipMailto(subject?: string) {
  const s = subject ?? "Interés en Kaviro para agencias";
  return `mailto:${AGENCY_PARTNERSHIP_EMAIL}?subject=${encodeURIComponent(s)}`;
}
