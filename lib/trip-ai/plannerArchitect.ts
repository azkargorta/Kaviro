import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { PlannerBrief } from "@/lib/trip-ai/plannerBrief";
import { addDaysIso } from "@/lib/trip-ai/tripCreationDates";

export type ArchitectDayType =
  | "arrival"
  | "departure"
  | "full"
  | "transfer_scenic"
  | "transfer_practical"
  | "rest";

export type ArchitectStay = { stop: string; nights: number; reason?: string };

export type ArchitectDay = {
  dayNum: number;
  date: string;
  dayType: ArchitectDayType;
  base: string;
  summary: string;
  transferFrom: string | null;
  transferTo: string | null;
  mainActivities: string[];
  availableHours: number;
  notes: string | null;
};

export type TripArchitecture = {
  days: ArchitectDay[];
  stays: ArchitectStay[];
  reasoning: string | null;
};

type LatLng = { lat: number; lng: number };

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeDayType(v: unknown): ArchitectDayType {
  const t = clean(v).toLowerCase();
  if (t === "arrival" || t === "departure" || t === "full" || t === "transfer_scenic" || t === "transfer_practical" || t === "rest") {
    return t;
  }
  return "full";
}

function compactStaysFromDays(days: ArchitectDay[]): ArchitectStay[] {
  const out: ArchitectStay[] = [];
  for (const day of days) {
    const stop = clean(day.base);
    if (!stop) continue;
    const last = out[out.length - 1];
    if (last && last.stop.toLowerCase() === stop.toLowerCase()) last.nights += 1;
    else out.push({ stop, nights: 1 });
  }
  return out;
}

function fallbackArchitecture(params: {
  baseByDay: string[];
  startDate: string;
  totalDays: number;
  arrivalTime?: string | null;
  departureTime?: string | null;
}): TripArchitecture {
  const days: ArchitectDay[] = params.baseByDay.map((base, idx) => {
    const dayNum = idx + 1;
    const date = addDaysIso(params.startDate, idx);
    const prevBase = idx > 0 ? params.baseByDay[idx - 1] || null : null;
    const isTransfer = Boolean(prevBase && prevBase.toLowerCase() !== String(base).toLowerCase());
    const isArrival = dayNum === 1;
    const isDeparture = dayNum === params.totalDays;
    const dayType: ArchitectDayType =
      isArrival ? "arrival" : isDeparture ? "departure" : isTransfer ? "transfer_scenic" : "full";
    const summary = isArrival
      ? `Llegada${params.arrivalTime ? ` a las ${params.arrivalTime}` : ""}. Traslado al alojamiento y descanso.`
      : isDeparture
        ? `Último día${params.departureTime ? ` con salida a las ${params.departureTime}` : ""}. Mantener margen para regresar.`
        : isTransfer
          ? `Ruta ${prevBase} → ${base}. El trayecto forma parte del viaje y admite paradas.`
          : `Día completo para explorar ${base}.`;
    return {
      dayNum,
      date,
      dayType,
      base,
      summary,
      transferFrom: isTransfer ? prevBase : null,
      transferTo: isTransfer ? base : null,
      mainActivities: [],
      availableHours: isArrival ? 1 : isDeparture ? 5 : isTransfer ? 8 : 9,
      notes: isArrival ? "No meter visitas turísticas importantes." : isDeparture ? "No llenar el día completo." : null,
    };
  });
  return { days, stays: compactStaysFromDays(days), reasoning: "fallback" };
}

export function buildArchitectPrompt(params: {
  brief: PlannerBrief | null;
  notes: string;
  stops: Array<{ label: string; center: LatLng }>;
  totalDays: number;
  startDate: string;
  endDate: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  forcedStays?: ArchitectStay[];
}): string {
  const stopLabels = params.stops.map((s) => s.label).filter(Boolean);
  const forcedStaysText = (params.forcedStays || []).length
    ? params.forcedStays!.map((s) => `${s.stop} (${s.nights} noches)`).join(", ")
    : "ninguno";
  const sleepBases = params.brief?.sleepBases?.length ? params.brief.sleepBases.join(", ") : stopLabels.join(", ");
  return `Eres el Travel Architect de Kaviro. Piensa el viaje COMPLETO antes de rellenar actividades.

Devuelve SOLO JSON válido con este esquema:
{
  "days": [{
    "dayNum": 1,
    "date": "YYYY-MM-DD",
    "dayType": "arrival|departure|full|transfer_scenic|transfer_practical|rest",
    "base": "Ciudad donde se duerme esa noche",
    "summary": "Resumen del día en 1 frase",
    "transferFrom": "Ciudad origen o null",
    "transferTo": "Ciudad destino o null",
    "mainActivities": ["Experiencia principal 1", "Experiencia principal 2"],
    "availableHours": 8,
    "notes": "Observaciones o null"
  }],
  "stays": [{"stop": "Ciudad", "nights": 2, "reason": "opcional"}],
  "reasoning": "máximo 3 frases"
}

REGLAS OBLIGATORIAS:
1. Razonas el viaje entero, no días sueltos.
2. Si la llegada es a las ${params.arrivalTime || "?"}, el primer día es de llegada y no debe tener un día turístico completo.
3. Si la salida es a las ${params.departureTime || "?"}, el último día debe dejar margen real para volver.
4. Un traslado panorámico de 2–4 h por carretera puede ser la actividad principal del día.
5. No dejes días vacíos: incluso un traslado debe tener un resumen coherente y 1-3 anclas reales.
6. Respeta estas bases deseadas del usuario como conjunto: ${sleepBases || "sin especificar"}.
7. Si se te pasa un reparto de noches forzado, respétalo exactamente: ${forcedStaysText}.
8. Optimiza la ruta para minimizar km anclando llegada y salida.
9. Usa arrival, departure, transfer_scenic, transfer_practical, full o rest según corresponda.
10. availableHours debe reflejar horas reales disponibles para turismo.

Contexto del viaje:
- Fechas: ${params.startDate} → ${params.endDate} (${params.totalDays} días)
- Bases candidatas: ${stopLabels.join(", ")}
- Notas del viajero: ${params.notes || "sin notas adicionales"}
- Brief estructurado: ${JSON.stringify(params.brief || null)}`;
}

export function parseTripArchitecture(raw: unknown, fallback: TripArchitecture): TripArchitecture {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  const rawDays = Array.isArray(data.days) ? data.days : [];
  const days: ArchitectDay[] = rawDays
    .map((row, idx) => {
      const d = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!d) return null;
      const dayNum = clamp(Number(d.dayNum) || idx + 1, 1, 99);
      const base = clean(d.base) || fallback.days[idx]?.base || "";
      if (!base) return null;
      return {
        dayNum,
        date: clean(d.date) || fallback.days[idx]?.date || "",
        dayType: normalizeDayType(d.dayType),
        base,
        summary: clean(d.summary) || fallback.days[idx]?.summary || `Día ${dayNum} en ${base}.`,
        transferFrom: clean(d.transferFrom) || null,
        transferTo: clean(d.transferTo) || null,
        mainActivities: Array.isArray(d.mainActivities) ? d.mainActivities.map((x) => clean(x)).filter(Boolean).slice(0, 4) : [],
        availableHours: clamp(Number(d.availableHours) || fallback.days[idx]?.availableHours || 8, 0, 12),
        notes: clean(d.notes) || null,
      } satisfies ArchitectDay;
    })
    .filter((x): x is ArchitectDay => Boolean(x));
  const stays: ArchitectStay[] = Array.isArray(data.stays)
    ? data.stays.reduce<ArchitectStay[]>((acc, row) => {
        const s = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
        if (!s) return acc;
        const stop = clean(s.stop);
        const nights = clamp(Number(s.nights) || 0, 0, 60);
        if (!stop) return acc;
        acc.push({ stop, nights, reason: clean(s.reason) || undefined });
        return acc;
      }, [])
    : [];
  return {
    days: days.length === fallback.days.length ? days : fallback.days,
    stays: stays.length ? stays : compactStaysFromDays(days.length ? days : fallback.days),
    reasoning: clean(data.reasoning) || fallback.reasoning,
  };
}

export async function planTripArchitecture(params: {
  brief: PlannerBrief | null;
  notes: string;
  stops: Array<{ label: string; center: LatLng }>;
  totalDays: number;
  startDate: string;
  endDate: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  forcedStays?: ArchitectStay[];
}): Promise<TripArchitecture> {
  const baseByDay: string[] = [];
  for (const s of params.forcedStays || []) {
    for (let i = 0; i < s.nights; i++) baseByDay.push(s.stop);
  }
  if (!baseByDay.length) {
    const labels = params.stops.map((s) => s.label).filter(Boolean);
    const fallbackBase = labels[0] || "Destino";
    for (let i = 0; i < params.totalDays; i++) baseByDay.push(labels[i] || fallbackBase);
  }
  while (baseByDay.length < params.totalDays) baseByDay.push(baseByDay[baseByDay.length - 1] || params.stops[0]?.label || "Destino");
  baseByDay.splice(params.totalDays);
  const fallback = fallbackArchitecture({
    baseByDay,
    startDate: params.startDate,
    totalDays: params.totalDays,
    arrivalTime: params.arrivalTime,
    departureTime: params.departureTime,
  });
  const prompt = buildArchitectPrompt(params);
  try {
    const { text } = await askTripAIWithUsage(prompt, "planning", {
      provider: "gemini",
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    });
    const parsed = extractJsonObject(text);
    return parseTripArchitecture(parsed, fallback);
  } catch {
    return fallback;
  }
}
