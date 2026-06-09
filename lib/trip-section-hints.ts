export type TripSectionHintDef = {
  suffix: string;
  key: string;
  message: string;
};

export const TRIP_SECTION_HINTS: TripSectionHintDef[] = [
  {
    suffix: "/expenses",
    key: "expenses",
    message: "Añade tickets con el botón +. Kaviro calcula balances y quién debe a quién.",
  },
  {
    suffix: "/plan",
    key: "plan",
    message: "Aquí va el itinerario día a día. Puedes importar un PDF con la IA (Premium).",
  },
  {
    suffix: "/map",
    key: "map",
    message: "Rutas y puntos del viaje en el mapa. Útil durante el desplazamiento.",
  },
  {
    suffix: "/participants",
    key: "participants",
    message: "Invita por enlace de WhatsApp o busca usuarios que ya tengan cuenta en Kaviro.",
  },
  {
    suffix: "/resources",
    key: "resources",
    message: "Billetes, reservas y documentos compartidos del grupo.",
  },
  {
    suffix: "/ai-chat",
    key: "ai",
    message: "Asistente con contexto del viaje: organizar días, ideas y cambios al plan.",
  },
];

export function getTripSectionHint(pathname: string): TripSectionHintDef | null {
  return TRIP_SECTION_HINTS.find((h) => pathname.endsWith(h.suffix)) ?? null;
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
