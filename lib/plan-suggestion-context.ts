import { createServerSupabase } from "@/lib/trip-ai/serverSupabase";

type ActivityRow = {
  title?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  activity_kind?: string | null;
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

function isDinnerActivity(row: ActivityRow): boolean {
  const title = (row.title || "").toLowerCase();
  return /cena|dinner/.test(title);
}

function formatGap(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}

/** Huecos típicos que un humano revisaría en el día (para guiar a la IA o fallback local). */
export function analyzePlanDayGaps(acts: ActivityRow[]): string[] {
  if (acts.length === 0) return [];

  const sorted = [...acts].sort(
    (a, b) => (parseMinutes(a.activity_time) ?? 9999) - (parseMinutes(b.activity_time) ?? 9999)
  );
  const hints: string[] = [];
  const first = sorted[0]!;
  const firstMin = parseMinutes(first.activity_time);
  const hasBreakfast = sorted.some(isBreakfastActivity);

  if (firstMin != null && firstMin >= 9 * 60 + 15 && !hasBreakfast) {
    hints.push(
      `Primera actividad a las ${fmtTime(first.activity_time)} y no hay desayuno: conviene añadir desayuno ~08:00.`
    );
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = parseMinutes(sorted[i]!.activity_time);
    const end = parseMinutes(sorted[i + 1]!.activity_time);
    if (start == null || end == null) continue;
    const gap = end - start;
    if (gap < 150) continue;

    const midHasMeal = sorted.slice(i, i + 2).some(isMealActivity);
    const crossesLunch = start < 13 * 60 + 30 && end > 14 * 60 && !midHasMeal;
    if (crossesLunch || (gap >= 180 && !midHasMeal)) {
      hints.push(
        `Entre ${fmtTime(sorted[i]!.activity_time)} y ${fmtTime(sorted[i + 1]!.activity_time)} hay ${formatGap(gap)} sin comida intermedia.`
      );
    } else if (gap >= 120) {
      hints.push(
        `Entre ${fmtTime(sorted[i]!.activity_time)} y ${fmtTime(sorted[i + 1]!.activity_time)} hay ${formatGap(gap)}: valorar pausa, traslado explícito o margen.`
      );
    }
  }

  const last = sorted[sorted.length - 1]!;
  const lastMin = parseMinutes(last.activity_time);
  if (lastMin != null && lastMin < 19 * 60 && !sorted.some(isDinnerActivity)) {
    hints.push("No hay cena explícita al final del día.");
  }

  return hints.slice(0, 4);
}

/** Sugerencia local cuando el modelo responde null pero hay huecos claros. */
export function fallbackPlanSuggestionFromGaps(acts: ActivityRow[]): string | null {
  const gaps = analyzePlanDayGaps(acts);
  if (gaps.length === 0) return null;

  const sorted = [...acts].sort(
    (a, b) => (parseMinutes(a.activity_time) ?? 9999) - (parseMinutes(b.activity_time) ?? 9999)
  );
  const firstTitle =
    typeof sorted[0]?.title === "string" && sorted[0].title.trim() ? sorted[0].title.trim().slice(0, 40) : "la primera visita";

  if (gaps.some((g) => /desayuno/i.test(g))) {
    return `Añadir desayuno ~08:00 antes de ${firstTitle}`;
  }
  if (gaps.some((g) => /sin comida intermedia/i.test(g))) {
    return "Añadir comida o café entre actividades del mediodía";
  }
  if (gaps.some((g) => /No hay cena/i.test(g))) {
    return "Añadir cena al final del día";
  }
  if (gaps.some((g) => /traslado|margen|pausa/i.test(g))) {
    return "Añadir margen o traslado entre dos actividades seguidas";
  }
  return "Revisar tiempos libres y añadir una parada intermedia";
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

export async function buildPlanDayContextForSuggestion(tripId: string, date: string): Promise<string> {
  const acts = await loadPlanDayActivities(tripId, date);
  if (acts.length === 0) {
    return (
      `Día ${date}: todavía NO hay actividades planificadas.\n` +
      `Sugiere la primera actividad concreta para ese día (visita, comida, traslado o check-in).`
    );
  }

  const lines = acts.map((row) => {
    const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : "Sin título";
    const place =
      (typeof row.place_name === "string" && row.place_name.trim()) ||
      (typeof row.address === "string" && row.address.trim()) ||
      "";
    const kind = typeof row.activity_kind === "string" ? row.activity_kind : "";
    return `- ${fmtTime(row.activity_time)} ${title}${place ? ` @ ${place}` : ""}${kind ? ` [${kind}]` : ""}`;
  });

  const gaps = analyzePlanDayGaps(acts);
  const gapBlock =
    gaps.length > 0
      ? `\nHuecos detectados en este día (DEBES proponer mejora sobre uno de ellos; no respondas null):\n${gaps.map((g) => `- ${g}`).join("\n")}\n`
      : "\nEl día parece cubierto; aun así busca un detalle menor (traslado, reserva, buffer 15–30 min).\n";

  return (
    `Día ${date} — ${acts.length} actividad(es) planificada(s):\n${lines.join("\n")}\n` +
    gapBlock +
    `Prioriza: desayuno si la primera visita es tarde, comidas en huecos >2,5 h, traslados explícitos, reservas.`
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
      ? `\nNO repitas ni parafrasees estas sugerencias ya mostradas:\n${params.exclude.map((item) => `- ${item}`).join("\n")}\n`
      : "";

  return `${params.tripSummary}

${params.dayContext}
${excludeHint}
Eres un revisor de itinerarios. Propón UNA mejora concreta y accionable para ese día.
Prioriza: huecos sin actividad, comidas faltantes, traslados, solapes, reservas, margen de descanso o primera actividad si el día está vacío.
Si el bloque «Huecos detectados» lista algún punto, es OBLIGATORIO proponer mejora sobre uno de ellos (no respondas null).
Formato: una sola frase en español, modo imperativo (empieza por verbo: Añadir, Reservar, Mover…), máximo 15 palabras.
PROHIBIDO empezar por «Considera», «Podrías» o «Te sugiero».
Responde null SOLO si el día no pertenece al viaje o no hay ninguna actividad ni contexto (caso muy excepcional).`;
}

/** Segundo intento más insistente si el modelo fue demasiado conservador. */
export function buildPlanSuggestionRetryPrompt(params: { tripSummary: string; dayContext: string }): string {
  return `${params.tripSummary}

${params.dayContext}

El plan puede parecer correcto, pero necesito UNA mejora menor aunque sea pequeña: buffer de 30 min, comida, traslado, reserva, alternativa lluvia o descanso.
Una sola frase imperativa en español (máx. 15 palabras). Solo null si el día no existe en el viaje.`;
}
