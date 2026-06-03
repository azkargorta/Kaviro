/** Qué bloques del viaje origen se copian al usar una plantilla. */
export type TripTemplateIncludes = {
  plan: boolean;
  routes: boolean;
  docs: boolean;
  lists: boolean;
  notes: boolean;
  activityKinds: boolean;
  announcements: boolean;
};

export const DEFAULT_TRIP_TEMPLATE_INCLUDES: TripTemplateIncludes = {
  plan: true,
  routes: true,
  docs: true,
  lists: true,
  notes: true,
  activityKinds: true,
  announcements: false,
};

export const TEMPLATE_INCLUDE_LABELS: Array<{
  key: keyof TripTemplateIncludes;
  label: string;
  hint: string;
}> = [
  { key: "plan", label: "Plan (actividades)", hint: "Itinerario, horarios y ubicaciones del plan." },
  { key: "routes", label: "Rutas", hint: "Rutas guardadas en el mapa (mejor con plan incluido)." },
  { key: "docs", label: "Docs", hint: "Fichas de documentos y reservas; los archivos adjuntos no se duplican." },
  { key: "lists", label: "Listas", hint: "Listas de equipaje u otras listas del viaje." },
  { key: "notes", label: "Notas del programa", hint: "Texto de descripción / notas generales del viaje." },
  { key: "activityKinds", label: "Tipos de actividad", hint: "Categorías personalizadas del plan (visita, comida…)." },
  { key: "announcements", label: "Avisos al grupo", hint: "Mensajes de avisos visibles en el portal." },
];

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function parseTripTemplateIncludes(raw: unknown): TripTemplateIncludes {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TRIP_TEMPLATE_INCLUDES };
  const o = raw as Record<string, unknown>;
  return {
    plan: asBool(o.plan, DEFAULT_TRIP_TEMPLATE_INCLUDES.plan),
    routes: asBool(o.routes, DEFAULT_TRIP_TEMPLATE_INCLUDES.routes),
    docs: asBool(o.docs, DEFAULT_TRIP_TEMPLATE_INCLUDES.docs),
    lists: asBool(o.lists, DEFAULT_TRIP_TEMPLATE_INCLUDES.lists),
    notes: asBool(o.notes, DEFAULT_TRIP_TEMPLATE_INCLUDES.notes),
    activityKinds: asBool(o.activityKinds, DEFAULT_TRIP_TEMPLATE_INCLUDES.activityKinds),
    announcements: asBool(o.announcements, DEFAULT_TRIP_TEMPLATE_INCLUDES.announcements),
  };
}

export function formatTemplateIncludesSummary(includes: TripTemplateIncludes): string {
  const labels: string[] = [];
  for (const { key, label } of TEMPLATE_INCLUDE_LABELS) {
    if (includes[key]) labels.push(label.split(" (")[0]!);
  }
  return labels.length ? labels.join(", ") : "Solo estructura del viaje";
}

export function normalizeTripTemplateIncludes(
  input?: Partial<TripTemplateIncludes> | null
): TripTemplateIncludes {
  const base = { ...DEFAULT_TRIP_TEMPLATE_INCLUDES };
  if (!input) return base;
  for (const key of Object.keys(base) as (keyof TripTemplateIncludes)[]) {
    if (typeof input[key] === "boolean") base[key] = input[key]!;
  }
  if (!base.plan && base.routes) {
    base.routes = false;
  }
  return base;
}
