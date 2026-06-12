export type TripSectionHintDef = {
  suffix: string;
  key: string;
  message: string;
};

/** Ayuda contextual por pestaña (se muestra bajo demanda, no en Resumen). */
export const TRIP_SECTION_HINTS: TripSectionHintDef[] = [
  {
    suffix: "/expenses",
    key: "expenses",
    message: "Añade gastos con el botón +. Kaviro reparte importes y calcula quién debe a quién.",
  },
  {
    suffix: "/map",
    key: "map",
    message: "Visualiza paradas del plan y trayectos del viaje. Útil para orientarte en ruta.",
  },
  {
    suffix: "/participants",
    key: "participants",
    message: "Invita por enlace, asigna roles y gestiona quién forma parte del viaje.",
  },
  {
    suffix: "/resources",
    key: "resources",
    message: "Guarda billetes, reservas y archivos del grupo para tenerlos siempre a mano.",
  },
  {
    suffix: "/ai-chat",
    key: "ai",
    message: "Pide itinerarios, ideas, cambios al plan o respuestas con el contexto de este viaje.",
  },
];

export function getTripSectionHint(pathname: string): TripSectionHintDef | null {
  return TRIP_SECTION_HINTS.find((h) => pathname.endsWith(h.suffix)) ?? null;
}

export function isTripSummaryPath(pathname: string, tripId: string): boolean {
  const base = `/trip/${tripId}`;
  return pathname === base || pathname === `${base}/summary`;
}

export const KAVIRO_TRIP_HELP_TOGGLE_EVENT = "kaviro:trip-help-toggle";

export function dispatchTripHelpToggle(open?: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(KAVIRO_TRIP_HELP_TOGGLE_EVENT, { detail: { open } }));
  } catch {
    /* */
  }
}
