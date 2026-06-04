import type { TripTabKey } from "@/lib/trip-tab-assets";

export type TripNavItem = {
  key: TripTabKey;
  label: string;
  sublabel?: string;
  href: (id: string) => string;
  isPremiumGated?: boolean;
};

/** Avisos del organizador (viajes Kaviro Trips para viajeros). */
export const TRAVELER_ANNOUNCEMENTS_NAV: TripNavItem = {
  key: "announcements",
  label: "Avisos",
  sublabel: "Del organizador",
  href: (id) => `/trip/${id}/announcements`,
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

/** Navegación Kaviro Trips (agencia) — sin resumen, gastos ni recap social. */
export const AGENCY_TRIP_NAV: TripNavItem[] = [
  { key: "plan", label: "Plan", sublabel: "Itinerario", href: (id) => `/trip/${id}/plan` },
  { key: "map", label: "Rutas", sublabel: "Logística", href: (id) => `/trip/${id}/map` },
  { key: "resources", label: "Docs", sublabel: "Dossier", href: (id) => `/trip/${id}/resources` },
  { key: "participants", label: "Equipo", sublabel: "Coordinación", href: (id) => `/trip/${id}/participants` },
  { key: "messages", label: "Mensajes", sublabel: "Chat del grupo", href: (id) => `/trip/${id}/messages` },
  { key: "chat", label: "Herramientas IA", sublabel: "Importar y organizar", href: (id) => `/trip/${id}/ai-chat` },
  { key: "settings", label: "Ajustes", sublabel: "Programa y portal", href: (id) => `/trip/${id}/settings` },
];

export const AGENCY_TRIP_BLOCKED_PATH_SUFFIXES = [
  "/summary",
  "/expenses",
  "/recap",
  "/overview",
  "/today",
] as const;

export function getTripNavItems(isAgencyTrip: boolean, isAgencyManaged = false): TripNavItem[] {
  if (isAgencyTrip) return AGENCY_TRIP_NAV;
  if (!isAgencyManaged) return PERSONAL_TRIP_NAV;

  const items = [...PERSONAL_TRIP_NAV];
  const settingsIdx = items.findIndex((i) => i.key === "settings");
  if (settingsIdx >= 0) {
    items.splice(settingsIdx, 0, TRAVELER_ANNOUNCEMENTS_NAV);
  } else {
    items.push(TRAVELER_ANNOUNCEMENTS_NAV);
  }
  return items;
}

export function isAgencyTripBlockedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return AGENCY_TRIP_BLOCKED_PATH_SUFFIXES.some((s) => pathname.endsWith(s));
}

export function agencyTripDefaultPath(tripId: string) {
  return `/trip/${tripId}/plan`;
}
