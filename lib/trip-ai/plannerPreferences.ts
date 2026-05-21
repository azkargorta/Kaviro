/** Preferencias explícitas del formulario del planificador IA. */

export type NearbyExcursionsPref = "yes" | "maybe" | "no";

export type TripStyleId =
  | "weekend-city"
  | "beach-week"
  | "road-trip"
  | "cultural"
  | "nature"
  | "family"
  | "custom";

export type PlannerPreferences = {
  nearbyExcursions: NearbyExcursionsPref;
  mixStylesWhenTime: boolean;
  tripStyle: TripStyleId | null;
};

const DEFAULT_PREFS: PlannerPreferences = {
  nearbyExcursions: "maybe",
  mixStylesWhenTime: true,
  tripStyle: null,
};

const VALID_STYLES = new Set<TripStyleId>([
  "weekend-city",
  "beach-week",
  "road-trip",
  "cultural",
  "nature",
  "family",
  "custom",
]);

export function parsePlannerPreferences(body: unknown): PlannerPreferences {
  const raw =
    body && typeof body === "object" && "plannerPreferences" in body
      ? (body as { plannerPreferences?: unknown }).plannerPreferences
      : body && typeof body === "object"
        ? body
        : null;

  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };

  const o = raw as Record<string, unknown>;
  const nearby = o.nearbyExcursions ?? o.nearby_excursions;
  const nearbyExcursions: NearbyExcursionsPref =
    nearby === "yes" || nearby === "no" ? nearby : "maybe";

  const mixRaw = o.mixStylesWhenTime ?? o.mix_styles_when_time;
  const mixStylesWhenTime = mixRaw === false ? false : true;

  const styleRaw = String(o.tripStyle ?? o.trip_style ?? "").trim();
  const tripStyle: TripStyleId | null = VALID_STYLES.has(styleRaw as TripStyleId)
    ? (styleRaw as TripStyleId)
    : null;

  return { nearbyExcursions, mixStylesWhenTime, tripStyle };
}

export function allowsNearbyExcursions(prefs: PlannerPreferences): boolean {
  return prefs.nearbyExcursions !== "no";
}

export function prefersNearbyExcursions(prefs: PlannerPreferences): boolean {
  return prefs.nearbyExcursions === "yes";
}

const NEARBY_NOTE: Record<NearbyExcursionsPref, string> = {
  yes: "Excursiones a pueblos o lugares cercanos: SÍ, le interesan si encajan en el viaje.",
  maybe: "Excursiones cercanas: solo si sobra tiempo o ya cubrió lo principal de la ciudad base.",
  no: "Excursiones a pueblos cercanos: NO; prefiere quedarse en la ciudad base sin desplazamientos largos.",
};

const STYLE_LABEL: Record<Exclude<TripStyleId, "custom">, string> = {
  "weekend-city": "ciudad y turismo urbano",
  "beach-week": "playa y relax",
  "road-trip": "road trip con varias paradas",
  cultural: "cultura e historia",
  nature: "naturaleza y senderismo",
  family: "viaje en familia",
};

const STYLE_MIX_HINTS: Partial<Record<TripStyleId, string>> = {
  nature:
    "Prioriza naturaleza, miradores y rutas al aire libre. Si el día tiene margen, puedes añadir 1–2 actividades complementarias (museo local pequeño, mercado, experiencia gastronómica suave, actividad de aventura ligera) sin eclipsar la naturaleza.",
  "beach-week":
    "Prioriza playa y relax. Si sobra tiempo, añade paseos costeros, pueblos con encanto cercanos (solo si el viajero acepta excursiones) o un museo/mirador breve.",
  cultural:
    "Prioriza museos, monumentos y patrimonio. Si sobra tiempo, añade barrios con encanto, mercados o una ruta natural corta cercana.",
  family:
    "Prioriza actividades familiares y ritmo tranquilo. Si sobra tiempo, alterna parques, museos interactivos y alguna experiencia diferente (aventura suave, mercado).",
  "weekend-city":
    "Prioriza lo esencial urbano. Si sobra tiempo, añade barrios, gastronomía con nombre propio o un mirador.",
  "road-trip":
    "Variedad entre paradas: mezcla conducción razonable con naturaleza, pueblos y algún hito cultural en cada zona.",
};

/** Añade al contexto de notas las preferencias estructuradas del formulario. */
export function enrichNotesWithPlannerPrefs(notes: string, prefs: PlannerPreferences): string {
  const parts = [notes.trim(), NEARBY_NOTE[prefs.nearbyExcursions]];
  if (prefs.tripStyle && prefs.tripStyle !== "custom") {
    parts.push(`Tipo de viaje elegido: ${STYLE_LABEL[prefs.tripStyle]}.`);
  }
  if (prefs.mixStylesWhenTime && prefs.tripStyle && STYLE_MIX_HINTS[prefs.tripStyle]) {
    parts.push(STYLE_MIX_HINTS[prefs.tripStyle]!);
  } else if (!prefs.mixStylesWhenTime && prefs.tripStyle && prefs.tripStyle !== "custom") {
    parts.push(
      "Mantén el plan centrado en el estilo elegido; no añadas categorías muy distintas salvo que el viajero lo pida en texto libre."
    );
  }
  return parts.filter(Boolean).join(" | ");
}

export function buildNearbyExcursionPromptLine(
  city: string,
  prefs: PlannerPreferences,
  dayIdx: number,
  hints: string[]
): string {
  if (prefs.nearbyExcursions === "no") {
    return `\nEl viajero NO quiere excursiones fuera de ${city}: todas las actividades dentro de la ciudad base.`;
  }
  if (prefs.nearbyExcursions === "maybe" && dayIdx < 3) {
    return `\nEnfócate en ${city}; excursión cercana solo si ya agotaste opciones distintas en días previos.`;
  }
  if (hints.length) {
    return `\nSi ya cubriste lo esencial de ${city}, excursión de 1 día (k=excursion) a: ${hints.join(", ")}.`;
  }
  if (prefersNearbyExcursions(prefs) || dayIdx > 1) {
    return `\nSi agotaste ${city}, propón excursión de 1 día a pueblo, costa o lugar cercano verificable (k=excursion).`;
  }
  return "";
}

export function buildStyleMixPromptLine(prefs: PlannerPreferences): string {
  if (!prefs.mixStylesWhenTime) return "";
  const hint = prefs.tripStyle ? STYLE_MIX_HINTS[prefs.tripStyle] : null;
  if (hint) return `\n${hint}`;
  return "\nSi un día tiene margen tras lo principal, puedes añadir 1–2 actividades de otro estilo que encajen con las preferencias del viajero.";
}
