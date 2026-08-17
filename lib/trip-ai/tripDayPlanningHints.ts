/**
 * Análisis por día del plan existente para raíles del asistente IA (Tema 1).
 * No muta datos; genera texto de contexto para el prompt.
 */

export type TripActivityForDayHints = {
  title: string;
  activity_date: string | null;
  activity_time: string | null;
  place_name?: string | null;
  address?: string | null;
  activity_kind?: string | null;
};

const FULL_DAY_PATTERN =
  /\b(disney|disneyland|parque tem[aá]tico|parque nacional|safari|cataratas?|iguaz[uú]|full day|d[ií]a completo|todo el d[ií]a|jornada completa|excursi[oó]n de d[ií]a entero|theme park|universal studios|port aventura)\b/i;

const PARTIAL_DAY_PATTERN =
  /\b(subir|ascensor|mirador|entrad[ao]|ticket|visita guiada de \d+h?|solo la mañana|solo la tarde|medio d[ií]a)\b/i;

const DAY_WINDOW_START = 9 * 60;
const DAY_WINDOW_END = 21 * 60;
const MIN_DEAD_GAP_MIN = 120;

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time || !String(time).trim()) return null;
  const m = String(time).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function activityLabel(a: TripActivityForDayHints): string {
  const place = (a.place_name || a.address || "").trim();
  return place ? `${a.title} (${place})` : a.title;
}

/** Duración estimada cuando no hay duration_min en BD. */
export function estimateActivityDurationMinutes(a: TripActivityForDayHints): number {
  const blob = `${a.title} ${a.place_name || ""} ${a.address || ""}`;
  if (FULL_DAY_PATTERN.test(blob) && !PARTIAL_DAY_PATTERN.test(blob)) return 480;
  const kind = (a.activity_kind || "").toLowerCase();
  if (kind === "lodging") return 60;
  if (kind === "transport") return 120;
  if (kind === "restaurant") return 90;
  if (kind === "museum") return 150;
  if (kind === "activity") return 180;
  if (kind === "visit") return 120;
  return 90;
}

export function isLikelyFullDayBlock(a: TripActivityForDayHints): boolean {
  return estimateActivityDurationMinutes(a) >= 420;
}

export type DayLoadAnalysis = {
  date: string;
  activityCount: number;
  estimatedBusyMinutes: number;
  fullDayBlocks: string[];
  deadGaps: Array<{ from: string; to: string; minutes: number }>;
  hasTimedActivities: boolean;
};

export function analyzeDayLoad(activities: TripActivityForDayHints[], date: string): DayLoadAnalysis {
  const dayActs = activities.filter((a) => a.activity_date === date);
  const fullDayBlocks = dayActs.filter(isLikelyFullDayBlock).map(activityLabel);
  const estimatedBusyMinutes = dayActs.reduce((sum, a) => sum + estimateActivityDurationMinutes(a), 0);

  const timed = dayActs
    .map((a) => ({ a, start: parseTimeToMinutes(a.activity_time) }))
    .filter((x): x is { a: TripActivityForDayHints; start: number } => x.start != null)
    .sort((x, y) => x.start - y.start);

  const deadGaps: DayLoadAnalysis["deadGaps"] = [];

  if (timed.length >= 1) {
    let cursor = DAY_WINDOW_START;
    for (const { a, start } of timed) {
      const dur = estimateActivityDurationMinutes(a);
      if (start - cursor >= MIN_DEAD_GAP_MIN) {
        deadGaps.push({ from: formatMinutes(cursor), to: formatMinutes(start), minutes: start - cursor });
      }
      cursor = Math.max(cursor, start + dur);
    }
    if (DAY_WINDOW_END - cursor >= MIN_DEAD_GAP_MIN) {
      deadGaps.push({ from: formatMinutes(cursor), to: formatMinutes(DAY_WINDOW_END), minutes: DAY_WINDOW_END - cursor });
    }
  } else if (dayActs.length > 0 && fullDayBlocks.length === 0 && estimatedBusyMinutes < 360) {
    deadGaps.push({
      from: formatMinutes(DAY_WINDOW_START),
      to: formatMinutes(DAY_WINDOW_END),
      minutes: DAY_WINDOW_END - DAY_WINDOW_START - estimatedBusyMinutes,
    });
  }

  return {
    date,
    activityCount: dayActs.length,
    estimatedBusyMinutes,
    fullDayBlocks,
    deadGaps: deadGaps.filter((g) => g.minutes >= MIN_DEAD_GAP_MIN),
    hasTimedActivities: timed.length > 0,
  };
}

export function userAskedToAddActivities(question: string): boolean {
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    /\b(anade|agrega|añade|busca|buscar|rellena|completa|mas actividades|más actividades|que mas|qué mas|suger|propón|propone|ideas para|planes para|algo mas|algo más)\b/.test(
      q
    ) || /\b(sobra tiempo|tiempo libre|hueco|horas muertas)\b/.test(q)
  );
}

export function userAskedToReplacePlan(question: string): boolean {
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /\b(reemplaz|sustitu|empezar de cero|rehaz todo|borra el plan|nuevo plan completo|plan entero de nuevo)\b/.test(q);
}

export function buildTripDayPlanningHintsBlock(params: {
  activities: TripActivityForDayHints[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  userQuestion: string;
}): string {
  const { activities, userQuestion } = params;
  const total = activities.length;

  if (total === 0) {
    return [
      "RAÍLES PLAN POR DÍA:",
      "- El viaje no tiene actividades todavía: puedes proponer un itinerario completo (KAVIRO_ITINERARY) si el usuario lo pide.",
      "- Si solo pregunta dudas generales, responde sin JSON ejecutable.",
    ].join("\n");
  }

  const dates = [...new Set(activities.map((a) => a.activity_date).filter(Boolean))] as string[];
  dates.sort();
  const dayLines: string[] = [];
  const daysWithDeadTime: string[] = [];

  for (const date of dates.slice(0, 14)) {
    const load = analyzeDayLoad(activities, date);
    const gapText =
      load.deadGaps.length > 0
        ? load.deadGaps.map((g) => `${g.from}–${g.to} (~${Math.round(g.minutes / 60)}h libre)`).join("; ")
        : load.fullDayBlocks.length > 0
          ? "día ocupado (bloque largo)"
          : "sin huecos claros";
    dayLines.push(`  · ${date}: ${load.activityCount} actividad(es); ${gapText}`);
    if (load.deadGaps.length > 0) daysWithDeadTime.push(date);
  }

  const wantsAdd = userAskedToAddActivities(userQuestion);
  const wantsReplace = userAskedToReplacePlan(userQuestion);

  return [
    "RAÍLES PLAN POR DÍA (viaje con actividades existentes):",
    `- Total actividades en contexto: ${total}. Prioriza cambios por DÍA concreto (fecha), no regenerar todo el viaje salvo petición explícita de reemplazo.`,
    wantsReplace
      ? "- El usuario pidió REEMPLAZAR o empezar de cero: puedes proponer KAVIRO_ITINERARY completo; la app pedirá confirmación antes de aplicar."
      : "- NO emitas KAVIRO_ITINERARY completo para sustituir el plan entero. Usa KAVIRO_DIFF (create_activity / update_activity) o KAVIRO_DAYPLAN para un solo día.",
    wantsAdd
      ? "- El usuario pidió MÁS actividades o rellenar tiempo: busca sugerencias y añade con create_activity en el diff (o dayplan), sin duplicar lo ya listado ese día."
      : daysWithDeadTime.length > 0
        ? `- Hay huecos horarios en: ${daysWithDeadTime.join(", ")}. PREGUNTA si quieren añadir planes ese día antes de proponer creates, salvo que ya hayan dicho que sí.`
        : "- Si un día parece lleno (bloque de día completo tipo parque o cataratas), no añadas visitas extra ese día salvo que el usuario lo pida.",
    "- Anti-duplicados: no repitas la misma visita el mismo día. Sí permitido: la misma atracción en días distintos (ej. ver la Torre Eiffel un día y subir otro; Cataratas del Iguazú día 1 y día 2 del recorrido).",
    "- Variante distinta mismo lugar (ver vs subir) cuenta como actividades diferentes si el usuario lo pide.",
    "",
    "Carga por día (estimada, ventana 09:00–21:00):",
    dayLines.length ? dayLines.join("\n") : "  · (sin fechas en actividades)",
  ].join("\n");
}
