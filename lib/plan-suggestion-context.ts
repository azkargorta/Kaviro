import { createServerSupabase } from "@/lib/trip-ai/serverSupabase";
import { splitCityCountry } from "@/lib/document-parsers/helpers";

type ActivityRow = {
  title?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  activity_kind?: string | null;
};

export type PlanDayGapKind =
  | "city_transfer"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "meal_gap"
  | "free_time"
  | "sparse_day"
  | "transfer";

export type PlanDayGap = {
  kind: PlanDayGapKind;
  hint: string;
  suggestion: string;
};

export type PlanDayAnalysisContext = {
  date?: string;
  prevDayActivities?: ActivityRow[];
  nextDayActivities?: ActivityRow[];
  tripDestination?: string | null;
};

function fmtTime(value: string | null | undefined) {
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return "??:??";
}

function parseMinutes(time: string | null | undefined): number | null {
  if (!time || !/^\d{2}:\d{2}/.test(time)) return null;
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function addDaysIso(iso: string, delta: number): string {
  const base = new Date(`${iso}T12:00:00`);
  base.setDate(base.getDate() + delta);
  return base.toISOString().slice(0, 10);
}

function normalizeCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function locationText(row: ActivityRow): string {
  const place = typeof row.place_name === "string" ? row.place_name.trim() : "";
  const address = typeof row.address === "string" ? row.address.trim() : "";
  return [place, address].filter(Boolean).join(", ");
}

/** Extrae ciudad probable de place_name/address (p. ej. «…, Tokio, Japón» → Tokio). */
export function extractActivityCity(row: ActivityRow): string | null {
  const text = locationText(row);
  if (!text) return null;

  const split = splitCityCountry(text);
  if (split.city) return normalizeCity(split.city);

  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts.length >= 3 ? parts[parts.length - 2]! : parts[0]!;
    if (candidate && candidate.length >= 2 && candidate.length <= 40) {
      return normalizeCity(candidate.replace(/^\d+\s+/, ""));
    }
  }

  const title = typeof row.title === "string" ? row.title.trim() : "";
  const fromTitle = /(?:en|a)\s+([A-Za-zÀ-ÿ'’\-\s]{3,})$/i.exec(title);
  if (fromTitle?.[1] && fromTitle[1].length <= 30) return normalizeCity(fromTitle[1]);

  return null;
}

function displayCity(cityKey: string): string {
  return cityKey
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMealActivity(row: ActivityRow): boolean {
  const kind = (row.activity_kind || "").toLowerCase();
  const title = (row.title || "").toLowerCase();
  return (
    kind === "restaurant" ||
    /desayuno|comida|cena|almuerzo|merienda|breakfast|lunch|dinner|brunch|café|cafe|restaurant|comer/.test(title)
  );
}

function isBreakfastActivity(row: ActivityRow): boolean {
  const title = (row.title || "").toLowerCase();
  return /desayuno|breakfast|brunch/.test(title);
}

function isLunchActivity(row: ActivityRow): boolean {
  const title = (row.title || "").toLowerCase();
  const kind = (row.activity_kind || "").toLowerCase();
  if (/comida|almuerzo|lunch/.test(title)) return true;
  if (kind === "restaurant" && !/desayuno|breakfast|cena|dinner/.test(title)) {
    const minutes = parseMinutes(row.activity_time);
    if (minutes == null) return true;
    return minutes >= 11 * 60 && minutes <= 15 * 60 + 30;
  }
  return false;
}

function isDinnerActivity(row: ActivityRow): boolean {
  const title = (row.title || "").toLowerCase();
  return /cena|dinner/.test(title);
}

function isTransportActivity(row: ActivityRow): boolean {
  const kind = (row.activity_kind || "").toLowerCase();
  const title = (row.title || "").toLowerCase();
  return (
    kind === "transport" ||
    /traslado|tren|shinkansen|avión|avion|vuelo|ferry|barco|autobús|autobus|bus|viaje en|desplazamiento|estación|estacion|aeropuerto|check-in|check out|checkout/.test(
      title
    )
  );
}

function formatGap(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

function shortTitle(row: ActivityRow, fallback = "la actividad"): string {
  if (typeof row.title === "string" && row.title.trim()) return row.title.trim().slice(0, 40);
  return fallback;
}

function sortActivities(acts: ActivityRow[]): ActivityRow[] {
  return [...acts].sort(
    (a, b) => (parseMinutes(a.activity_time) ?? 9999) - (parseMinutes(b.activity_time) ?? 9999)
  );
}

function hasMealBetween(sorted: ActivityRow[], startMin: number, endMin: number): boolean {
  return sorted.some((row) => {
    const minutes = parseMinutes(row.activity_time);
    return minutes != null && minutes > startMin && minutes < endMin && isMealActivity(row);
  });
}

function hasTransportBetween(sorted: ActivityRow[], startIdx: number, endIdx: number): boolean {
  for (let i = startIdx; i <= endIdx; i += 1) {
    if (isTransportActivity(sorted[i]!)) return true;
  }
  return false;
}

function pushCityTransferGap(
  gaps: PlanDayGap[],
  fromCity: string,
  toCity: string,
  fromLabel: string,
  toLabel: string,
  scope: "inicio del día" | "entre actividades"
) {
  gaps.push({
    kind: "city_transfer",
    hint: `Cambio de ciudad (${displayCity(fromCity)} → ${displayCity(toCity)}) ${scope} sin traslado explícito.`,
    suggestion: `Añadir traslado ${displayCity(fromCity)}–${displayCity(toCity)} entre ${fromLabel} y ${toLabel}`,
  });
}

function isGapExcludedBySuggestions(gap: PlanDayGap, exclude: string[]): boolean {
  if (exclude.length === 0) return false;

  const blob = exclude.join(" ").toLowerCase();
  if (gap.kind === "breakfast" && /desayuno|breakfast|brunch/.test(blob)) return true;
  if ((gap.kind === "lunch" || gap.kind === "meal_gap") && /comida|almuerzo|lunch|café|cafe/.test(blob)) {
    return true;
  }
  if (gap.kind === "dinner" && /cena|dinner/.test(blob)) return true;
  if (gap.kind === "city_transfer" && /traslado|tren|shinkansen|avión|avion|vuelo|transporte|viaje|autobús|autobus|ferry/.test(blob)) {
    return true;
  }
  if ((gap.kind === "free_time" || gap.kind === "sparse_day") && /actividad|visita|paseo|explorar|experiencia|tarde/.test(blob)) {
    return true;
  }
  if (gap.kind === "transfer" && /traslado|margen|pausa|buffer/.test(blob)) return true;

  const suggestion = gap.suggestion.toLowerCase();
  return exclude.some((item) => {
    const ex = item.toLowerCase().trim();
    if (!ex) return false;
    return ex === suggestion || ex.includes(suggestion) || suggestion.includes(ex);
  });
}

function dedupeGaps(gaps: PlanDayGap[]): PlanDayGap[] {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = `${gap.kind}:${gap.suggestion}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Huecos estructurados que un humano revisaría en el día. */
export function buildPlanDayGaps(acts: ActivityRow[], ctx: PlanDayAnalysisContext = {}): PlanDayGap[] {
  if (acts.length === 0) return [];

  const sorted = sortActivities(acts);
  const gaps: PlanDayGap[] = [];

  const prevSorted = ctx.prevDayActivities?.length ? sortActivities(ctx.prevDayActivities) : [];
  if (prevSorted.length > 0) {
    const prevLast = prevSorted[prevSorted.length - 1]!;
    const firstToday = sorted[0]!;
    const prevCity = extractActivityCity(prevLast);
    const firstCity = extractActivityCity(firstToday);
    const startsWithTransport = isTransportActivity(firstToday);
    if (prevCity && firstCity && prevCity !== firstCity && !startsWithTransport) {
      pushCityTransferGap(
        gaps,
        prevCity,
        firstCity,
        shortTitle(prevLast, "fin del día anterior"),
        shortTitle(firstToday, "primera actividad"),
        "inicio del día"
      );
    }
  }

  const first = sorted[0]!;
  const firstMin = parseMinutes(first.activity_time);
  const hasBreakfast = sorted.some(isBreakfastActivity);
  const firstVisit = sorted.find((row) => !isBreakfastActivity(row)) || first;

  if (firstMin != null && firstMin >= 9 * 60 + 15 && !hasBreakfast) {
    gaps.push({
      kind: "breakfast",
      hint: `Primera actividad a las ${fmtTime(first.activity_time)} y no hay desayuno: conviene añadir desayuno ~08:00.`,
      suggestion: `Añadir desayuno ~08:00 antes de ${shortTitle(firstVisit)}`,
    });
  }

  const times = sorted.map((row) => parseMinutes(row.activity_time)).filter((value): value is number => value != null);
  const minTime = times.length > 0 ? Math.min(...times) : null;
  const maxTime = times.length > 0 ? Math.max(...times) : null;
  const hasLunch = sorted.some(isLunchActivity);
  const spansLunchWindow = minTime != null && maxTime != null && minTime < 13 * 60 + 30 && maxTime > 11 * 60 + 30;

  if (spansLunchWindow && !hasLunch) {
    let anchorBefore = sorted[0]!;
    let anchorAfter = sorted[sorted.length - 1]!;
    for (let i = 0; i < sorted.length; i += 1) {
      const minutes = parseMinutes(sorted[i]!.activity_time);
      if (minutes != null && minutes <= 13 * 60) anchorBefore = sorted[i]!;
    }
    for (let i = 0; i < sorted.length; i += 1) {
      const minutes = parseMinutes(sorted[i]!.activity_time);
      if (minutes != null && minutes >= 11 * 60 + 30) {
        anchorAfter = sorted[i]!;
        break;
      }
    }

    gaps.push({
      kind: "lunch",
      hint: `El día cubre el mediodía (${fmtTime(anchorBefore.activity_time)}–${fmtTime(anchorAfter.activity_time)}) pero no hay comida/almuerzo planificado.`,
      suggestion: `Añadir comida ~12:30 entre ${shortTitle(anchorBefore, "visita")} y ${shortTitle(anchorAfter, "siguiente parada")}`,
    });
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i]!;
    const to = sorted[i + 1]!;
    const fromCity = extractActivityCity(from);
    const toCity = extractActivityCity(to);
    if (fromCity && toCity && fromCity !== toCity && !hasTransportBetween(sorted, i, i + 1)) {
      pushCityTransferGap(
        gaps,
        fromCity,
        toCity,
        shortTitle(from),
        shortTitle(to),
        "entre actividades"
      );
    }

    const start = parseMinutes(from.activity_time);
    const end = parseMinutes(to.activity_time);
    if (start == null || end == null) continue;
    const gapMinutes = end - start;
    if (gapMinutes < 150) continue;

    const intervalHasMeal = hasMealBetween(sorted, start, end);
    const crossesLunch = start < 14 * 60 && end > 12 * 60;
    const longGapWithoutMeal = gapMinutes >= 180 && !intervalHasMeal;

    if ((crossesLunch && !intervalHasMeal) || longGapWithoutMeal) {
      gaps.push({
        kind: "meal_gap",
        hint: `Entre ${fmtTime(from.activity_time)} y ${fmtTime(to.activity_time)} hay ${formatGap(gapMinutes)} sin comida intermedia.`,
        suggestion: `Añadir comida o café entre ${shortTitle(from)} y ${shortTitle(to)}`,
      });
    } else if (gapMinutes >= 240) {
      gaps.push({
        kind: "free_time",
        hint: `Entre ${fmtTime(from.activity_time)} y ${fmtTime(to.activity_time)} hay ${formatGap(gapMinutes)} sin actividades: se puede añadir otra visita o experiencia.`,
        suggestion: `Añadir visita o actividad entre ${shortTitle(from)} y ${shortTitle(to)}`,
      });
    } else if (gapMinutes >= 120) {
      gaps.push({
        kind: "transfer",
        hint: `Entre ${fmtTime(from.activity_time)} y ${fmtTime(to.activity_time)} hay ${formatGap(gapMinutes)}: valorar pausa, traslado explícito o margen.`,
        suggestion: `Añadir margen o traslado entre ${shortTitle(from)} y ${shortTitle(to)}`,
      });
    }
  }

  const timedCount = sorted.filter((row) => parseMinutes(row.activity_time) != null).length;
  const last = sorted[sorted.length - 1]!;
  const lastMin = parseMinutes(last.activity_time);

  if (lastMin != null && lastMin < 19 * 60 && !sorted.some(isDinnerActivity)) {
    gaps.push({
      kind: "dinner",
      hint: "No hay cena explícita al final del día.",
      suggestion: "Añadir cena al final del día",
    });
  }

  if (lastMin != null && lastMin < 17 * 60 && timedCount <= 4) {
    gaps.push({
      kind: "sparse_day",
      hint: `El día acaba sobre las ${fmtTime(last.activity_time)} con pocas actividades (${timedCount}); queda tarde sin cubrir.`,
      suggestion: "Añadir actividades o paseo por la tarde-noche",
    });
  }

  if (timedCount <= 2 && minTime != null && maxTime != null && maxTime - minTime < 5 * 60) {
    gaps.push({
      kind: "sparse_day",
      hint: `Solo ${timedCount} actividades planificadas en un bloque corto; el día tiene mucho tiempo libre.`,
      suggestion: "Ampliar el plan con más visitas o experiencias en el día",
    });
  }

  return dedupeGaps(gaps);
}

/** Resumen legible de lo que el día necesita. */
export function summarizePlanDayNeeds(acts: ActivityRow[], ctx: PlanDayAnalysisContext = {}): string {
  const gaps = buildPlanDayGaps(acts, ctx);
  if (gaps.length === 0) {
    return "Cobertura razonable; revisar reservas, traslados locales o detalles menores.";
  }

  const kinds = new Set(gaps.map((gap) => gap.kind));
  const parts: string[] = [];
  if (kinds.has("city_transfer")) parts.push("traslado entre ciudades");
  if (kinds.has("breakfast")) parts.push("desayuno");
  if (kinds.has("lunch") || kinds.has("meal_gap")) parts.push("comida del mediodía");
  if (kinds.has("free_time") || kinds.has("sparse_day")) parts.push("más actividades en tiempo libre");
  if (kinds.has("dinner")) parts.push("cena");
  if (kinds.has("transfer")) parts.push("margen/traslados locales");

  return `Este día necesita sobre todo: ${parts.join(", ")}.`;
}

/** Huecos típicos que un humano revisaría en el día (para guiar a la IA o fallback local). */
export function analyzePlanDayGaps(acts: ActivityRow[], ctx: PlanDayAnalysisContext = {}): string[] {
  return buildPlanDayGaps(acts, ctx)
    .map((gap) => gap.hint)
    .slice(0, 8);
}

export function listRemainingPlanDayGaps(
  acts: ActivityRow[],
  exclude: string[] = [],
  ctx: PlanDayAnalysisContext = {}
): PlanDayGap[] {
  return buildPlanDayGaps(acts, ctx).filter((gap) => !isGapExcludedBySuggestions(gap, exclude));
}

/** Sugerencia local cuando el modelo responde null pero hay huecos claros. */
export function fallbackPlanSuggestionFromGaps(
  acts: ActivityRow[],
  exclude: string[] = [],
  ctx: PlanDayAnalysisContext = {}
): string | null {
  const remaining = listRemainingPlanDayGaps(acts, exclude, ctx);
  return remaining[0]?.suggestion ?? null;
}

export function isDuplicatePlanSuggestion(suggestion: string, exclude: string[]): boolean {
  const normalized = suggestion.trim().toLowerCase();
  if (!normalized) return true;
  return exclude.some((item) => {
    const ex = item.trim().toLowerCase();
    if (!ex) return false;
    return ex === normalized || ex.includes(normalized) || normalized.includes(ex);
  });
}

/** Contexto enfocado en un día concreto para sugerencias del plan. */
export async function loadPlanDayActivities(tripId: string, date: string): Promise<ActivityRow[]> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("trip_activities")
    .select("title, activity_time, place_name, address, activity_kind")
    .eq("trip_id", tripId)
    .eq("activity_date", date)
    .order("activity_time", { ascending: true, nullsFirst: false });
  return (data || []) as ActivityRow[];
}

export async function loadAdjacentPlanDayActivities(
  tripId: string,
  date: string
): Promise<{ prev: ActivityRow[]; next: ActivityRow[] }> {
  const prevDate = addDaysIso(date, -1);
  const nextDate = addDaysIso(date, 1);
  const [prev, next] = await Promise.all([
    loadPlanDayActivities(tripId, prevDate),
    loadPlanDayActivities(tripId, nextDate),
  ]);
  return { prev, next };
}

export async function buildPlanDayContextForSuggestion(
  tripId: string,
  date: string,
  exclude: string[] = []
): Promise<string> {
  const [acts, adjacent, tripRes] = await Promise.all([
    loadPlanDayActivities(tripId, date),
    loadAdjacentPlanDayActivities(tripId, date),
    createServerSupabase().from("trips").select("destination").eq("id", tripId).maybeSingle(),
  ]);

  const ctx: PlanDayAnalysisContext = {
    date,
    prevDayActivities: adjacent.prev,
    nextDayActivities: adjacent.next,
    tripDestination: typeof tripRes.data?.destination === "string" ? tripRes.data.destination : null,
  };

  if (acts.length === 0) {
    const prevCity =
      adjacent.prev.length > 0 ? extractActivityCity(adjacent.prev[adjacent.prev.length - 1]!) : null;
    const nextCity = adjacent.next.length > 0 ? extractActivityCity(adjacent.next[0]!) : null;
    const travelHint =
      prevCity && nextCity && prevCity !== nextCity
        ? `\nContexto: ayer en ${displayCity(prevCity)} y mañana en ${displayCity(nextCity)}; puede ser día de traslado.\n`
        : "";

    return (
      `Día ${date}: todavía NO hay actividades planificadas.\n` +
      travelHint +
      `Analiza qué necesita este día del viaje (traslado, check-in, visitas, comidas) y sugiere la primera actividad concreta.`
    );
  }

  const lines = acts.map((row) => {
    const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : "Sin título";
    const place =
      (typeof row.place_name === "string" && row.place_name.trim()) ||
      (typeof row.address === "string" && row.address.trim()) ||
      "";
    const city = extractActivityCity(row);
    const kind = typeof row.activity_kind === "string" ? row.activity_kind : "";
    return `- ${fmtTime(row.activity_time)} ${title}${place ? ` @ ${place}` : ""}${city ? ` [${displayCity(city)}]` : ""}${kind ? ` (${kind})` : ""}`;
  });

  const cities = Array.from(new Set(acts.map(extractActivityCity).filter(Boolean))).map((city) => displayCity(city!));
  const cityLine =
    cities.length > 0
      ? `Ciudades/zona del día: ${cities.join(", ")}${cities.length > 1 ? " (hay cambio de ciudad en el día)" : ""}.\n`
      : "";

  const adjacentLine =
    adjacent.prev.length > 0 || adjacent.next.length > 0
      ? [
          adjacent.prev.length > 0
            ? `Día anterior (${addDaysIso(date, -1)}): última actividad «${shortTitle(adjacent.prev[adjacent.prev.length - 1]!)}»${extractActivityCity(adjacent.prev[adjacent.prev.length - 1]!) ? ` en ${displayCity(extractActivityCity(adjacent.prev[adjacent.prev.length - 1]!)!)}` : ""}.`
            : null,
          adjacent.next.length > 0
            ? `Día siguiente (${addDaysIso(date, 1)}): primera actividad «${shortTitle(adjacent.next[0]!)}»${extractActivityCity(adjacent.next[0]!) ? ` en ${displayCity(extractActivityCity(adjacent.next[0]!)!)}` : ""}.`
            : null,
        ]
          .filter(Boolean)
          .join("\n") + "\n"
      : "";

  const remainingGaps = listRemainingPlanDayGaps(acts, exclude, ctx);
  const needsSummary = summarizePlanDayNeeds(acts, ctx);
  const gapBlock =
    remainingGaps.length > 0
      ? `\nHuecos detectados en este día (DEBES proponer mejora sobre el PRIMERO de esta lista; no respondas null):\n${remainingGaps
          .slice(0, 6)
          .map((gap) => `- ${gap.hint}`)
          .join("\n")}\n`
      : exclude.length > 0
        ? "\nYa se cubrieron los huecos principales; busca otro detalle (actividad extra, traslado local, reserva, buffer 15–30 min).\n"
        : "\nEl día parece cubierto; aun así busca un detalle menor (actividad extra, traslado, reserva, buffer 15–30 min).\n";

  return (
    `Día ${date} — ${acts.length} actividad(es) planificada(s):\n${lines.join("\n")}\n` +
    cityLine +
    adjacentLine +
    `Diagnóstico: ${needsSummary}\n` +
    gapBlock +
    `Prioriza: traslado si cambia de ciudad, desayuno/comida/cena si faltan, más actividades en huecos largos, traslados locales y reservas.`
  );
}

export function cleanPlanSuggestion(raw: string): string | null {
  const text = raw
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/^IA sugiere:?\s*/i, "")
    .replace(/^Sugerencia:?\s*/i, "")
    .trim();

  if (!text || text.length < 10) return null;
  if (/^(null|ninguna|nada|ok|está bien|no hay)/i.test(text)) return null;
  if (/^considera\s/i.test(text)) return null;

  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export function buildPlanSuggestionPrompt(params: {
  tripSummary: string;
  dayContext: string;
  exclude: string[];
}): string {
  const excludeHint =
    params.exclude.length > 0
      ? `\nNO repitas ni parafrasees estas sugerencias ya mostradas:\n${params.exclude.map((item) => `- ${item}`).join("\n")}\nPropón la SIGUIENTE mejora distinta (otro hueco del día: traslado, comida, visita extra…).\n`
      : "";

  return `${params.tripSummary}

${params.dayContext}
${excludeHint}
Eres un revisor de itinerarios. Analiza qué necesita ESE día concreto del viaje y propón UNA mejora accionable.
Prioriza: traslados si cambia de ciudad, comidas faltantes (desayuno, comida/almuerzo, cena), más actividades en huecos largos o días ligeros, traslados locales, solapes, reservas y margen de descanso.
Si el bloque «Huecos detectados» lista algún punto, es OBLIGATORIO proponer mejora sobre el primero pendiente (no respondas null).
Formato: una sola frase en español, modo imperativo (empieza por verbo: Añadir, Reservar, Mover…), máximo 15 palabras.
PROHIBIDO empezar por «Considera», «Podrías» o «Te sugiero».
Responde null SOLO si el día no pertenece al viaje o no hay ninguna actividad ni contexto (caso muy excepcional).`;
}

/** Segundo intento más insistente si el modelo fue demasiado conservador. */
export function buildPlanSuggestionRetryPrompt(params: {
  tripSummary: string;
  dayContext: string;
  exclude?: string[];
}): string {
  const excludeHint =
    params.exclude && params.exclude.length > 0
      ? `\nYa sugeriste (no repetir): ${params.exclude.join(" | ")}\n`
      : "";

  return `${params.tripSummary}

${params.dayContext}
${excludeHint}
El plan puede parecer correcto, pero necesito UNA mejora concreta: traslado entre ciudades, comida si falta, visita extra en tiempo libre, buffer de 30 min, reserva o alternativa lluvia.
Una sola frase imperativa en español (máx. 15 palabras). Solo null si el día no existe en el viaje.`;
}
