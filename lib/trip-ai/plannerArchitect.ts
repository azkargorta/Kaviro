import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { PlannerBrief } from "@/lib/trip-ai/plannerBrief";
import { addDaysIso } from "@/lib/trip-ai/tripCreationDates";
import { planStaysToMinimizeDriving, roundedDriveHours } from "@/lib/trip-ai/plannerStayRoute";

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
  const legs = params.stops
    .flatMap((a, i) => params.stops.slice(i + 1).map((b) => {
      const h = roundedDriveHours(a.center, b.center);
      return `- ${a.label} ↔ ${b.label}: unas ${h} h de coche (no uses 1-2 h si la cifra es mayor)`;
    }))
    .join("\n");
  const wantsNature = (params.brief?.interests || []).some((x) => /natur|trek|excurs|paisaj|quebrada|salina|cerro|monta/i.test(x))
    || /natur|trek|excurs/i.test(params.notes);
  const wantsWine = (params.brief?.interests || []).some((x) => /vino|bodega|gastro/i.test(x))
    || /vino|bodega/i.test(params.notes);
  const driving = params.brief?.transport === "driving" || /coche|alquiler|carretera/i.test(params.notes);
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
3. Si la salida es a las ${params.departureTime || "?"}, el último día debe dejar margen real para volver al aeropuerto/estación (devolución de coche, combustible, 3 h de colchón antes del vuelo). No programes una excursión lejana ese día.
4. Un traslado usa las horas de coche REALES de la lista de distancias. PROHIBIDO escribir "1 h" o "2 h" si la estimación es mayor.
5. Si dos bases están a 4.5 h o más, NO las encadenes en un solo día ni duermas en una y al día siguiente en la otra sin pasar por el hub de llegada/salida. Inserta una noche en el hub o parte el cruce.
6. En un día de traslado, mainActivities solo pueden ser paradas SOBRE la ruta (o a la llegada). Nunca una visita que esté en dirección contraria.
7. No repitas la misma ancla en dos días (quebrada, garganta, anfiteatro, pueblo, bodega).
8. ${wantsNature ? "El viajero pidió NATURALEZA: cada zona debe tener 1 excursión principal de paisaje con nombre propio real (las que harían famosa esa región: parques, salinas, quebradas, glaciares, acantilados, islas, dunas, selva). No sustituyas eso por museos, plazas o iglesias." : "Prioriza las experiencias por las que merece la pena ir a esa zona, no relleno genérico."}
9. ${wantsWine && driving ? "Vino/bodegas: máximo 1 cata por día y 2 en todo el viaje (hay un conductor)." : wantsWine ? "Vino/bodegas: máximo 2 visitas en todo el viaje." : "No satures el viaje de bodegas."}
10. Ritmo ${params.brief?.pace || "balanced"}: deja 2 h entre anclas para comer, aparcar y retrasos. No encadenes 4 pueblos en un día.
11. Si hay valle/costa suave y alta montaña o etapas duras, empieza por lo más suave.
12. mainActivities OBLIGATORIAS: 1 o 2 nombres propios reales por día (no "explorar el centro").
13. Respeta estas bases deseadas del usuario como conjunto: ${sleepBases || "sin especificar"}.
14. Si se te pasa un reparto de noches forzado, respétalo exactamente salvo que viole la regla de 4.5 h: ${forcedStaysText}.
15. availableHours = horas reales de turismo, restando el coche.

Distancias estimadas en coche:
${legs || "- sin pares"}

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
  if (!baseByDay.length && params.stops.length) {
    const routed = planStaysToMinimizeDriving(params.stops, params.totalDays, {
      startHint: params.brief?.arrival.place || params.brief?.destination,
      endHint: params.brief?.departure.place || params.brief?.arrival.place,
    });
    for (const s of routed) {
      for (let i = 0; i < s.nights; i++) baseByDay.push(s.stop);
    }
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
