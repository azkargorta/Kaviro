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

export type PlannerPace = "relaxed" | "balanced" | "intense";
export type PlannerBudgetBand = "low" | "medium" | "comfortable" | "premium";
export type PlannerStayChangePref = "few" | "medium" | "many";

export type PlannerBrief = {
  destination: string | null;
  destinationKind: PlannerDestinationKind | null;
  sleepBases: string[];
  origin: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  arrival: PlannerLeg;
  departure: PlannerLeg;
  transport: PlannerTransport | null;
  nearbyExcursions: "yes" | "maybe" | "no" | null;
  travelersType: "solo" | "couple" | "friends" | "family" | null;
  travelerCount: number | null;
  pace: PlannerPace | null;
  budgetBand: PlannerBudgetBand | null;
  stayChangePref: PlannerStayChangePref | null;
  interests: string[];
  constraints: string[];
  avoid: string[];
  mustDo: string[];
  suggestedTripName: string | null;
  arrivalSkipped: boolean;
  departureSkipped: boolean;
  travelersSkipped: boolean;
  styleSkipped: boolean;
  paceSkipped: boolean;
};

export type PlannerMissingField =
  | "destination"
  | "sleepBases"
  | "dates"
  | "arrival"
  | "departure"
  | "transport"
  | "travelers"
  | "style"
  | "pace";

const EMPTY_LEG: PlannerLeg = { place: null, date: null, time: null };

export function emptyPlannerBrief(): PlannerBrief {
  return {
    destination: null,
    destinationKind: null,
    sleepBases: [],
    origin: null,
    startDate: null,
    endDate: null,
    durationDays: null,
    arrival: { ...EMPTY_LEG },
    departure: { ...EMPTY_LEG },
    transport: null,
    nearbyExcursions: null,
    travelersType: null,
    travelerCount: null,
    pace: null,
    budgetBand: null,
    stayChangePref: null,
    interests: [],
    constraints: [],
    avoid: [],
    mustDo: [],
    suggestedTripName: null,
    arrivalSkipped: false,
    departureSkipped: false,
    travelersSkipped: false,
    styleSkipped: false,
    paceSkipped: false,
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

  const paceRaw = str(o.pace);
  const pace: PlannerPace | null =
    paceRaw === "relaxed" || paceRaw === "balanced" || paceRaw === "intense" ? paceRaw : null;

  const budgetRaw = str(o.budgetBand);
  const budgetBand: PlannerBudgetBand | null =
    budgetRaw === "low" || budgetRaw === "medium" || budgetRaw === "comfortable" || budgetRaw === "premium"
      ? budgetRaw
      : null;

  const stayRaw = str(o.stayChangePref);
  const stayChangePref: PlannerStayChangePref | null =
    stayRaw === "few" || stayRaw === "medium" || stayRaw === "many" ? stayRaw : null;

  const travelerCount =
    typeof o.travelerCount === "number" && Number.isFinite(o.travelerCount)
      ? Math.max(1, Math.min(40, Math.round(o.travelerCount)))
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
    origin: str(o.origin),
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
    travelerCount,
    pace,
    budgetBand,
    stayChangePref,
    interests: strList(o.interests),
    constraints: strList(o.constraints),
    avoid: strList(o.avoid),
    mustDo: strList(o.mustDo),
    suggestedTripName: str(o.suggestedTripName),
    arrivalSkipped: o.arrivalSkipped === true,
    departureSkipped: o.departureSkipped === true,
    travelersSkipped: o.travelersSkipped === true,
    styleSkipped: o.styleSkipped === true,
    paceSkipped: o.paceSkipped === true,
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
    origin: patch.origin ?? prev.origin,
    startDate: patch.startDate ?? prev.startDate,
    endDate: patch.endDate ?? prev.endDate,
    durationDays: patch.durationDays ?? prev.durationDays,
    arrival: mergeLeg(prev.arrival, patch.arrival),
    departure: mergeLeg(prev.departure, patch.departure),
    transport: patch.transport ?? prev.transport,
    nearbyExcursions: patch.nearbyExcursions ?? prev.nearbyExcursions,
    travelersType: patch.travelersType ?? prev.travelersType,
    travelerCount: patch.travelerCount ?? prev.travelerCount,
    pace: patch.pace ?? prev.pace,
    budgetBand: patch.budgetBand ?? prev.budgetBand,
    stayChangePref: patch.stayChangePref ?? prev.stayChangePref,
    interests: [...new Set([...prev.interests, ...patch.interests])].slice(0, 12),
    constraints: [...new Set([...prev.constraints, ...patch.constraints])].slice(0, 12),
    avoid: [...new Set([...prev.avoid, ...patch.avoid])].slice(0, 12),
    mustDo: [...new Set([...prev.mustDo, ...patch.mustDo])].slice(0, 12),
    suggestedTripName: patch.suggestedTripName ?? prev.suggestedTripName,
    arrivalSkipped: prev.arrivalSkipped || patch.arrivalSkipped,
    departureSkipped: prev.departureSkipped || patch.departureSkipped,
    travelersSkipped: prev.travelersSkipped || patch.travelersSkipped,
    styleSkipped: prev.styleSkipped || patch.styleSkipped,
    paceSkipped: prev.paceSkipped || patch.paceSkipped,
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

function hasTravelers(brief: PlannerBrief): boolean {
  if (brief.travelersSkipped) return true;
  return Boolean(brief.travelersType || brief.travelerCount);
}

function hasStyle(brief: PlannerBrief): boolean {
  if (brief.styleSkipped) return true;
  return brief.interests.length > 0 || brief.mustDo.length > 0;
}

function hasPace(brief: PlannerBrief): boolean {
  if (brief.paceSkipped) return true;
  return brief.pace != null;
}

export function getPlannerMissingField(brief: PlannerBrief): PlannerMissingField | null {
  if (!brief.destination) return "destination";
  if (needsSleepBases(brief)) return "sleepBases";
  if (!hasDates(brief)) return "dates";
  if (!hasArrival(brief)) return "arrival";
  if (!hasDeparture(brief)) return "departure";
  if (brief.sleepBases.length > 1 && !brief.transport) return "transport";
  if (!hasTravelers(brief)) return "travelers";
  if (!hasStyle(brief)) return "style";
  if (!hasPace(brief)) return "pace";
  return null;
}

export const PLANNER_MISSING_QUESTIONS: Record<PlannerMissingField, string> = {
  destination: "¿A qué destino o destinos vais? Con el nombre de la ciudad, región o país basta.",
  sleepBases:
    "¿En qué ciudades o pueblos os encaja dormir? Da igual el orden: yo monto la ruta para no hacer trayectos de más, anclada a vuestra llegada y salida. Si prefieres, dime «propónmelo tú».",
  dates: "¿Qué fechas tenéis, o cuántos días dura el viaje?",
  arrival: "¿Dónde y a qué hora llegáis el primer día? (aeropuerto, estación…). Si aún no lo sabes, dímelo y lo dejamos abierto.",
  departure: "¿De dónde y a qué hora salís el último día? Si no lo tienes claro, dímelo y lo dejamos abierto.",
  transport: "Entre esas bases, ¿os moveréis en coche de alquiler, transporte público, o una mezcla?",
  travelers: "¿Viajáis en pareja, familia, amigos o tú solo? Si da igual, dime «tú decide».",
  style:
    "¿Qué tipo de viaje queréis: naturaleza, pueblos, vino, cultura, trekking, playa…? Puedes decir varios, o «tú decide» si lo dejo yo.",
  pace: "¿Preferís un ritmo relajado (pocas visitas), equilibrado o intenso? Si no lo tienes claro, lo dejo equilibrado.",
};

export const PLANNER_QUICK_REPLIES: Partial<Record<PlannerMissingField, string[]>> = {
  transport: ["Coche de alquiler", "Transporte público", "Una mezcla"],
  travelers: ["En pareja", "En familia", "Con amigos", "Voy solo", "Tú decide"],
  style: ["Naturaleza", "Pueblos", "Cultura", "Gastronomía y vino", "Trekking", "Playa", "Tú decide"],
  pace: ["Relajado", "Equilibrado", "Intenso", "Tú decide"],
};

const SKIPPABLE_FIELDS: PlannerMissingField[] = ["arrival", "departure", "travelers", "style", "pace"];

export function isPlannerSkipPhrase(text: string): boolean {
  const q = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /\b(no lo se|no se|aun no|todavia no|da igual|dejalo abierto|sin hora|no tengo hora|no lo tengo|mas adelante|tu decide|lo que quieras|como veas|proponlo tu|proponmelo tu)\b/.test(
    q
  );
}

export function applyPlannerFieldSkip(field: PlannerMissingField | null): PlannerBrief | null {
  if (!field || !SKIPPABLE_FIELDS.includes(field)) return null;
  const patch = emptyPlannerBrief();
  if (field === "arrival") patch.arrivalSkipped = true;
  if (field === "departure") patch.departureSkipped = true;
  if (field === "travelers") patch.travelersSkipped = true;
  if (field === "style") patch.styleSkipped = true;
  if (field === "pace") {
    patch.paceSkipped = true;
    patch.pace = "balanced";
  }
  return patch;
}

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
  if (brief.avoid.length) parts.push(`NO incluir: ${brief.avoid.join(", ")}.`);
  if (brief.mustDo.length) parts.push(`Imprescindible: ${brief.mustDo.join(", ")}.`);
  if (brief.pace === "relaxed") parts.push("Ritmo relajado: no llenar el día al 100%.");
  if (brief.pace === "balanced") parts.push("Ritmo equilibrado: 2-4 anclas al día, con margen para comer y traslados.");
  if (brief.pace === "intense") parts.push("Ritmo intenso: aprovechar el día, con margen para comer y traslados.");
  if (brief.stayChangePref === "few") parts.push("Prefiere pocas bases y menos cambios de hotel.");
  if (brief.stayChangePref === "many") parts.push("Acepta más cambios de base para ver más sitios.");
  if (brief.origin) parts.push(`Sale desde ${brief.origin}.`);
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
  if (brief.sleepBases.length) {
    parts.push(
      `Bases de noche (conjunto, NO un orden de ruta): ${brief.sleepBases.join(", ")}. Ordena las noches para minimizar kilómetros, anclando llegada y salida. No gastes un día entero en un traslado de 2–4 h: ese día lleva paradas en origen, ruta o destino. No insertes una noche puente en el hub entre radios opuestos si con eso dejas bases en 1 noche.`
    );
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
  if (brief.origin) lines.push(`Origen: ${brief.origin}`);
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
  if (brief.avoid.length) lines.push(`Evitar: ${brief.avoid.join(", ")}`);
  if (brief.mustDo.length) lines.push(`Imprescindible: ${brief.mustDo.join(", ")}`);
  if (brief.travelersType) {
    const label =
      brief.travelersType === "solo"
        ? "viajero solo"
        : brief.travelersType === "couple"
          ? "pareja"
          : brief.travelersType === "family"
            ? "familia"
            : "amigos";
    lines.push(`Compañía: ${label}${brief.travelerCount ? ` (${brief.travelerCount})` : ""}`);
  }
  if (brief.pace) {
    lines.push(
      `Ritmo: ${brief.pace === "relaxed" ? "relajado" : brief.pace === "intense" ? "intenso" : "equilibrado"}`
    );
  }
  if (brief.budgetBand) {
    const b =
      brief.budgetBand === "low"
        ? "ajustado"
        : brief.budgetBand === "medium"
          ? "medio"
          : brief.budgetBand === "comfortable"
            ? "cómodo"
            : "premium";
    lines.push(`Presupuesto: ${b}`);
  }
  return lines;
}
