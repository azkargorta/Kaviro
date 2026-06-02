import type { TripTabKey } from "@/lib/trip-tab-assets";

export type TripNavItem = {
  key: TripTabKey;
  label: string;
  sublabel?: string;
  href: (id: string) => string;
  isPremiumGated?: boolean;
};

/** Navegación B2C (viajero). */
export const PERSONAL_TRIP_NAV: TripNavItem[] = [
  { key: "summary", label: "Resumen", sublabel: "Vista general", href: (id) => `/trip/${id}/summary` },
  { key: "plan", label: "Plan", sublabel: "Itinerario", href: (id) => `/trip/${id}/plan` },
  { key: "map", label: "Rutas", sublabel: "Mapa", href: (id) => `/trip/${id}/map` },
  { key: "expenses", label: "Gastos", sublabel: "Finanzas", href: (id) => `/trip/${id}/expenses` },
  { key: "participants", label: "Gente", sublabel: "Participantes", href: (id) => `/trip/${id}/participants` },
  { key: "resources", label: "Docs", sublabel: "Documentos", href: (id) => `/trip/${id}/resources` },
  { key: "chat", label: "Asistente IA", sublabel: "Premium", href: (id) => `/trip/${id}/ai-chat`, isPremiumGated: true },
  { key: "settings", label: "Ajustes", sublabel: "Datos del viaje", href: (id) => `/trip/${id}/settings` },
];

/** Navegación Kaviro Trips (agencia) — sin resumen, gastos, mensajes ni recap social. */
export const AGENCY_TRIP_NAV: TripNavItem[] = [
  { key: "plan", label: "Plan", sublabel: "Itinerario", href: (id) => `/trip/${id}/plan` },
  { key: "map", label: "Rutas", sublabel: "Logística", href: (id) => `/trip/${id}/map` },
  { key: "resources", label: "Docs", sublabel: "Dossier", href: (id) => `/trip/${id}/resources` },
  { key: "participants", label: "Equipo", sublabel: "Coordinación", href: (id) => `/trip/${id}/participants` },
  { key: "chat", label: "Herramientas IA", sublabel: "Importar y organizar", href: (id) => `/trip/${id}/ai-chat`, isPremiumGated: true },
  { key: "settings", label: "Ajustes", sublabel: "Programa y portal", href: (id) => `/trip/${id}/settings` },
];

export const AGENCY_TRIP_BLOCKED_PATH_SUFFIXES = [
  "/summary",
  "/expenses",
  "/messages",
  "/recap",
  "/overview",
  "/today",
] as const;

export function getTripNavItems(isAgencyTrip: boolean): TripNavItem[] {
  return isAgencyTrip ? AGENCY_TRIP_NAV : PERSONAL_TRIP_NAV;
}

export function isAgencyTripBlockedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return AGENCY_TRIP_BLOCKED_PATH_SUFFIXES.some((s) => pathname.endsWith(s));
}

export function agencyTripDefaultPath(tripId: string) {
  return `/trip/${tripId}/plan`;
}
