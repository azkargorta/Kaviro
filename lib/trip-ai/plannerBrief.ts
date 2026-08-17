/**
 * Ficha de entrevista del planificador IA (viaje aún no creado).
 * Sin destinos hardcodeados: la IA extrae; las reglas de “qué falta” son genéricas.
 */

export type PlannerDestinationKind = "city" | "region" | "multi";

export type PlannerLeg = {
  place: string | null;
  date: string | null;
  time: string | null;
};

export type PlannerTransport = "driving" | "transit" | "walking" | "mixed";

export type PlannerBrief = {
  destination: string | null;
  destinationKind: PlannerDestinationKind | null;
  sleepBases: string[];
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  arrival: PlannerLeg;
  departure: PlannerLeg;
  transport: PlannerTransport | null;
  nearbyExcursions: "yes" | "maybe" | "no" | null;
  travelersType: "solo" | "couple" | "friends" | "family" | null;
  interests: string[];
  constraints: string[];
  suggestedTripName: string | null;
  arrivalSkipped: boolean;
  departureSkipped: boolean;
};

export type PlannerMissingField =
  | "destination"
  | "sleepBases"
  | "dates"
  | "arrival"
  | "departure"
  | "transport";

const EMPTY_LEG: PlannerLeg = { place: null, date: null, time: null };

export function emptyPlannerBrief(): PlannerBrief {
  return {
    destination: null,
    destinationKind: null,
    sleepBases: [],
    startDate: null,
    endDate: null,
    durationDays: null,
    arrival: { ...EMPTY_LEG },
    departure: { ...EMPTY_LEG },
    transport: null,
    nearbyExcursions: null,
    travelersType: null,
    interests: [],
    constraints: [],
    suggestedTripName: null,
    arrivalSkipped: false,
    departureSkipped: false,
  };
}

function isoDate(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function hhmm(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function str(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
}

function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x || "").trim()).filter(Boolean))].slice(0, 12);
}

export function normalizePlannerBrief(raw: unknown): PlannerBrief {
  const base = emptyPlannerBrief();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  const kindRaw = str(o.destinationKind);
  const destinationKind: PlannerDestinationKind | null =
    kindRaw === "city" || kindRaw === "region" || kindRaw === "multi" ? kindRaw : null;

  const transportRaw = str(o.transport);
  const transport: PlannerTransport | null =
    transportRaw === "driving" ||
    transportRaw === "transit" ||
    transportRaw === "walking" ||
    transportRaw === "mixed"
      ? transportRaw
      : null;

  const nearbyRaw = str(o.nearbyExcursions);
  const nearbyExcursions =
    nearbyRaw === "yes" || nearbyRaw === "maybe" || nearbyRaw === "no" ? nearbyRaw : null;

  const travelersRaw = str(o.travelersType);
  const travelersType =
    travelersRaw === "solo" ||
    travelersRaw === "couple" ||
    travelersRaw === "friends" ||
    travelersRaw === "family"
      ? travelersRaw
      : null;

  const arrivalIn = o.arrival && typeof o.arrival === "object" ? (o.arrival as Record<string, unknown>) : {};
  const departureIn =
    o.departure && typeof o.departure === "object" ? (o.departure as Record<string, unknown>) : {};

  const duration =
    typeof o.durationDays === "number" && Number.isFinite(o.durationDays)
      ? Math.max(1, Math.round(o.durationDays))
      : null;

  return {
    destination: str(o.destination),
    destinationKind,
    sleepBases: strList(o.sleepBases),
    startDate: isoDate(o.startDate),
    endDate: isoDate(o.endDate),
    durationDays: duration,
    arrival: {
      place: str(arrivalIn.place),
      date: isoDate(arrivalIn.date),
      time: hhmm(arrivalIn.time),
    },
    departure: {
      place: str(departureIn.place),
      date: isoDate(departureIn.date),
      time: hhmm(departureIn.time),
    },
    transport,
    nearbyExcursions,
    travelersType,
    interests: strList(o.interests),
    constraints: strList(o.constraints),
    suggestedTripName: str(o.suggestedTripName),
    arrivalSkipped: o.arrivalSkipped === true,
    departureSkipped: o.departureSkipped === true,
  };
}

function mergeLeg(prev: PlannerLeg, next: PlannerLeg): PlannerLeg {
  return {
    place: next.place ?? prev.place,
    date: next.date ?? prev.date,
    time: next.time ?? prev.time,
  };
}

export function mergePlannerBrief(prev: PlannerBrief, patch: PlannerBrief): PlannerBrief {
  const sleepBases =
    patch.sleepBases.length > 0
      ? [...new Set([...prev.sleepBases, ...patch.sleepBases])]
      : prev.sleepBases;

  return {
    destination: patch.destination ?? prev.destination,
    destinationKind: patch.destinationKind ?? prev.destinationKind,
    sleepBases: sleepBases.slice(0, 8),
    startDate: patch.startDate ?? prev.startDate,
    endDate: patch.endDate ?? prev.endDate,
    durationDays: patch.durationDays ?? prev.durationDays,
    arrival: mergeLeg(prev.arrival, patch.arrival),
    departure: mergeLeg(prev.departure, patch.departure),
    transport: patch.transport ?? prev.transport,
    nearbyExcursions: patch.nearbyExcursions ?? prev.nearbyExcursions,
    travelersType: patch.travelersType ?? prev.travelersType,
    interests: [...new Set([...prev.interests, ...patch.interests])].slice(0, 12),
    constraints: [...new Set([...prev.constraints, ...patch.constraints])].slice(0, 12),
    suggestedTripName: patch.suggestedTripName ?? prev.suggestedTripName,
    arrivalSkipped: prev.arrivalSkipped || patch.arrivalSkipped,
    departureSkipped: prev.departureSkipped || patch.departureSkipped,
  };
}

function hasDates(brief: PlannerBrief): boolean {
  if (brief.startDate && brief.endDate) return true;
  if (brief.durationDays && brief.durationDays > 0) return true;
  return false;
}

function needsSleepBases(brief: PlannerBrief): boolean {
  if (!brief.destination) return false;
  if (brief.sleepBases.length > 0) return false;
  if (brief.destinationKind === "city") return false;
  return brief.destinationKind === "region" || brief.destinationKind === "multi" || brief.destinationKind == null;
}

function hasArrival(brief: PlannerBrief): boolean {
  if (brief.arrivalSkipped) return true;
  return Boolean(brief.arrival.time || brief.arrival.place);
}

function hasDeparture(brief: PlannerBrief): boolean {
  if (brief.departureSkipped) return true;
  return Boolean(brief.departure.time || brief.departure.place);
}

export function getPlannerMissingField(brief: PlannerBrief): PlannerMissingField | null {
  if (!brief.destination) return "destination";
  if (needsSleepBases(brief)) return "sleepBases";
  if (!hasDates(brief)) return "dates";
  if (!hasArrival(brief)) return "arrival";
  if (!hasDeparture(brief)) return "departure";
  if (brief.sleepBases.length > 1 && !brief.transport) return "transport";
  return null;
}

export const PLANNER_MISSING_QUESTIONS: Record<PlannerMissingField, string> = {
  destination: "¿A qué destino o destinos vais? Con el nombre de la ciudad, región o país basta.",
  sleepBases:
    "Eso suena a región o a varios sitios. ¿En qué ciudad o pueblo queréis dormir? Podéis decir varias bases (una por zona) o pedirme que te proponga opciones.",
  dates: "¿Qué fechas tenéis, o cuántos días dura el viaje?",
  arrival: "¿Dónde y a qué hora llegáis el primer día? (aeropuerto, estación…). Si aún no lo sabes, dímelo y lo dejamos abierto.",
  departure: "¿De dónde y a qué hora salís el último día? Si no lo tienes claro, dímelo y lo dejamos abierto.",
  transport: "Entre esas bases, ¿os moveréis en coche de alquiler, transporte público, o una mezcla?",
};

export function plannerDestinationsForGenerate(brief: PlannerBrief): string[] {
  if (brief.sleepBases.length) return brief.sleepBases.slice(0, 8);
  if (brief.destination) return [brief.destination];
  return [];
}

/** Notas para el generador de itinerario (llegada/salida, coche, alrededores). */
export function buildPlannerFreeText(brief: PlannerBrief): string {
  const parts: string[] = [];
  if (brief.interests.length) parts.push(`Intereses: ${brief.interests.join(", ")}.`);
  if (brief.constraints.length) parts.push(`Restricciones: ${brief.constraints.join(", ")}.`);
  if (brief.travelersType) {
    const label =
      brief.travelersType === "solo"
        ? "viajero solo"
        : brief.travelersType === "couple"
          ? "pareja"
          : brief.travelersType === "family"
            ? "familia"
            : "grupo de amigos";
    parts.push(`Compañía: ${label}.`);
  }
  if (brief.transport === "driving") {
    parts.push("Transporte: coche de alquiler. Prioriza pueblos y lugares de alrededor accesibles por carretera.");
  } else if (brief.transport === "transit") {
    parts.push("Transporte: público (bus/tren). Evita tramos que solo se hagan bien en coche.");
  } else if (brief.transport === "walking") {
    parts.push("Transporte: a pie / ciudad compacta.");
  } else if (brief.transport === "mixed") {
    parts.push("Transporte mixto (coche y público).");
  }
  if (brief.nearbyExcursions === "yes" || brief.transport === "driving") {
    parts.push("Quiere visitar lugares de alrededor de las bases, no solo el centro.");
  } else if (brief.nearbyExcursions === "no") {
    parts.push("Prefiere quedarse en la ciudad base, sin excursiones largas.");
  }
  if (brief.arrival.time || brief.arrival.place) {
    const when = [brief.arrival.date, brief.arrival.time].filter(Boolean).join(" ");
    parts.push(
      `Llegada${brief.arrival.place ? ` a ${brief.arrival.place}` : ""}${when ? ` (${when})` : ""}. El primer día es de llegada: pocas o ninguna visita turística; traslado y noche.`
    );
  }
  if (brief.departure.time || brief.departure.place) {
    const when = [brief.departure.date, brief.departure.time].filter(Boolean).join(" ");
    parts.push(
      `Salida${brief.departure.place ? ` desde ${brief.departure.place}` : ""}${when ? ` (${when})` : ""}. El último día debe dejar margen realista para llegar al aeropuerto/estación; no lo llenes como un día completo.`
    );
  }
  return parts.join(" ");
}

import { addDaysIso, defaultTripStartDate, isIsoDate } from "@/lib/trip-ai/tripCreationDates";

export function resolvePlannerBriefDates(brief: PlannerBrief): { startDate: string; endDate: string } | null {
  const start = brief.startDate || brief.arrival.date;
  const end = brief.endDate || brief.departure.date;
  if (isIsoDate(start) && isIsoDate(end) && end >= start) return { startDate: start, endDate: end };
  if (isIsoDate(start) && brief.durationDays && brief.durationDays > 0) {
    return { startDate: start, endDate: addDaysIso(start, brief.durationDays - 1) };
  }
  if (brief.durationDays && brief.durationDays > 0) {
    const s = defaultTripStartDate();
    return { startDate: s, endDate: addDaysIso(s, brief.durationDays - 1) };
  }
  return null;
}

export function plannerBriefSummaryLines(brief: PlannerBrief): string[] {
  const lines: string[] = [];
  if (brief.destination) lines.push(`Destino: ${brief.destination}`);
  if (brief.sleepBases.length) lines.push(`Dónde dormir: ${brief.sleepBases.join(" · ")}`);
  if (brief.startDate && brief.endDate) lines.push(`Fechas: ${brief.startDate} → ${brief.endDate}`);
  else if (brief.durationDays) lines.push(`Duración: ${brief.durationDays} días`);
  if (brief.arrival.place || brief.arrival.time) {
    lines.push(
      `Llegada: ${[brief.arrival.place, brief.arrival.date, brief.arrival.time].filter(Boolean).join(" · ")}`
    );
  }
  if (brief.departure.place || brief.departure.time) {
    lines.push(
      `Salida: ${[brief.departure.place, brief.departure.date, brief.departure.time].filter(Boolean).join(" · ")}`
    );
  }
  if (brief.transport) {
    const t =
      brief.transport === "driving"
        ? "coche"
        : brief.transport === "transit"
          ? "transporte público"
          : brief.transport === "walking"
            ? "a pie"
            : "mixto";
    lines.push(`Movilidad: ${t}`);
  }
  if (brief.interests.length) lines.push(`Estilo: ${brief.interests.join(", ")}`);
  return lines;
}
