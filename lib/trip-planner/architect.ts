/**
 * Phase 1: Trip Architect.
 * Takes a TripBrief, geocodes destinations, and calls Gemini ONCE to produce a TripSkeleton.
 */

import { askGeminiWithUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import { geocodePhotonPreferred, geocodeTripAnchor, regionHintsFromDestination } from "@/lib/geocoding/photonGeocode";
import { haversineKm } from "@/lib/trip-ai/plannerStayRoute";
import type { TripBrief, TripSkeleton, SkeletonDay, SkeletonDayType } from "./types";
import { staysFromDays, addDaysToIso, totalDaysBetween } from "./types";

// ─── Geo helpers ──────────────────────────────────────────────────────────────

type LatLng = { lat: number; lng: number };
type GeoStop = { label: string; center: LatLng };

function driveHours(a: LatLng, b: LatLng): number {
  const km = haversineKm(a, b) * 1.3;
  return Math.max(0.5, km / 55);
}

function roundedDrive(a: LatLng, b: LatLng): number {
  return Math.max(1, Math.round(driveHours(a, b)));
}

type NightOverride = {
  date: string;
  base: string;
};

export type GenerateSkeletonOptions = {
  refinementNotes?: string;
};

// ─── Geocode destinations ─────────────────────────────────────────────────────

export async function geocodeDestinations(brief: TripBrief): Promise<GeoStop[]> {
  const destLabel = brief.destinations.join(" · ");
  const anchor = await geocodeTripAnchor(destLabel);
  const hints = regionHintsFromDestination(destLabel);
  const results = await Promise.all(
    brief.sleepBases.map(async (name) => {
      const geo = await geocodePhotonPreferred(name, { anchor, regionHints: hints, maxDistanceKm: 50000 });
      if (geo) return { label: name, center: { lat: geo.lat, lng: geo.lng } };
      const withDest = `${name}, ${brief.destinations[0] || ""}`.trim();
      const geo2 = await geocodePhotonPreferred(withDest, { anchor, regionHints: hints, maxDistanceKm: 50000 });
      if (geo2) return { label: name, center: { lat: geo2.lat, lng: geo2.lng } };
      return { label: name, center: anchor || { lat: 0, lng: 0 } };
    })
  );
  return results;
}

function allowedLabels(brief: TripBrief, stops: GeoStop[]): string[] {
  return [...new Set([...brief.sleepBases, ...stops.map((s) => s.label)])];
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

export function buildArchitectPrompt(
  brief: TripBrief,
  stops: GeoStop[],
  opts?: GenerateSkeletonOptions
): string {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const stopLabels = allowedLabels(brief, stops);
  const nightOverrides = extractNightOverrides(brief, stopLabels, opts?.refinementNotes);
  const legs = stops
    .flatMap((a, i) =>
      stops.slice(i + 1).map((b) => `- ${a.label} ↔ ${b.label}: ~${roundedDrive(a.center, b.center)} h en coche`)
    )
    .join("\n");

  return `Eres el Travel Architect. Diseña el ESQUELETO de un viaje: dónde duerme cada noche, qué tipo de día es, y 1-2 experiencias ancla por día.

Devuelve SOLO JSON válido:
{
  "days": [{
    "dayNum": 1,
    "date": "YYYY-MM-DD",
    "dayType": "arrival|departure|full|transfer_scenic|transfer_practical|rest",
    "base": "Ciudad donde duerme esa noche",
    "summary": "1 frase del día",
    "transferFrom": "Ciudad origen o null",
    "transferTo": "Ciudad destino o null",
    "mainActivities": ["Nombre propio real 1", "Nombre propio real 2"],
    "availableHours": 8,
    "notes": "Observaciones o null"
  }],
  "reasoning": "máximo 3 frases explicando la lógica"
}

REGLAS:
1. Cada "base" DEBE ser exactamente una de: ${stopLabels.join(", ")}. PROHIBIDO usar otras ciudades.
2. Llegada ${brief.arrival.time || "sin hora"}: primer día = arrival. No programar turismo completo.
3. Salida ${brief.departure.time || "sin hora"}: último día = departure. Margen para aeropuerto (3h colchón).
4. Traslados usan horas REALES de la lista. PROHIBIDO inventar "1h" si son 4h.
5. Si dos bases > 4.5h, NO encadenarlas: inserta noche puente.
6. mainActivities: nombres propios reales de esa zona (parques, quebradas, bodegas, miradores...). NO "explorar el centro".
7. Cada base pedida debe tener al menos 1 noche.
8. No repetir la misma ancla en dos días.
9. Ritmo: ${brief.pace || "balanced"}. Máx 2-3 anclas/día en intense, 1-2 en relaxed.
10. availableHours = horas reales de turismo, restando coche.
${brief.interests.length ? `11. Estilo preferido: ${brief.interests.join(", ")}.` : ""}
${brief.avoid.length ? `12. EVITAR: ${brief.avoid.join(", ")}.` : ""}
${brief.mustDo.length ? `13. OBLIGATORIO incluir: ${brief.mustDo.join(", ")}.` : ""}
${nightOverrides.length ? `14. OBLIGATORIO: respeta exactamente estas noches pedidas por el usuario:\n${nightOverrides.map((o) => `- ${o.date} -> ${o.base}`).join("\n")}` : ""}

Distancias:
${legs || "- sin pares de ciudades"}

Viaje:
- Fechas: ${brief.startDate} → ${brief.endDate} (${totalDays} días)
- Bases permitidas (SOLO estas): ${stopLabels.join(", ")}
- Transporte: ${brief.transport || "sin especificar"}
- Viajeros: ${brief.travelersType || "sin especificar"}${brief.travelerCount ? ` (${brief.travelerCount})` : ""}
${brief.freeText ? `- Notas: ${brief.freeText}` : ""}
${opts?.refinementNotes ? `- Cambios pedidos en el chat: ${opts.refinementNotes}` : ""}
${brief.constraints.length ? `- Restricciones: ${brief.constraints.join("; ")}` : ""}`;
}

// ─── Parse response ───────────────────────────────────────────────────────────

function normalizeDayType(v: unknown): SkeletonDayType {
  const t = String(v ?? "").trim().toLowerCase();
  if (["arrival", "departure", "full", "transfer_scenic", "transfer_practical", "rest"].includes(t)) {
    return t as SkeletonDayType;
  }
  return "full";
}

export function parseArchitectResponse(
  raw: unknown,
  brief: TripBrief,
  stops: GeoStop[],
  opts?: GenerateSkeletonOptions
): TripSkeleton {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const labels = allowedLabels(brief, stops);
  const nightOverrides = extractNightOverrides(brief, labels, opts?.refinementNotes);

  if (nightOverrides.length >= Math.max(1, totalDays - 1)) {
    return buildSkeletonFromNightOverrides(brief, nightOverrides, labels);
  }

  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawDays = Array.isArray(data.days) ? data.days : [];

  const days: SkeletonDay[] = rawDays
    .map((row, idx) => {
      const d = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!d) return null;
      const rawBase = String(d.base ?? "").trim();
      const base = resolveToKnown(rawBase, labels);
      if (!base) return null;
      return {
        dayNum: idx + 1,
        date: String(d.date ?? addDaysToIso(brief.startDate, idx)),
        dayType: normalizeDayType(d.dayType),
        base,
        summary: String(d.summary ?? `Día ${idx + 1} en ${base}.`),
        transferFrom: d.transferFrom ? resolveToKnown(String(d.transferFrom), labels) : null,
        transferTo: d.transferTo ? resolveToKnown(String(d.transferTo), labels) : null,
        mainActivities: Array.isArray(d.mainActivities)
          ? (d.mainActivities as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 3)
          : [],
        availableHours: Math.max(0, Math.min(12, Number(d.availableHours) || 8)),
        notes: d.notes ? String(d.notes) : null,
      } satisfies SkeletonDay;
    })
    .filter((x): x is SkeletonDay => x !== null);

  if (days.length === totalDays) {
    const withOverrides = applyNightOverrides(days, brief, nightOverrides);
    return {
      days: withOverrides,
      stays: staysFromDays(withOverrides),
      reasoning: String(data.reasoning ?? "") || null,
    };
  }

  return buildFallbackSkeleton(brief, stops, opts);
}

function resolveToKnown(name: string, labels: string[]): string | null {
  const n = name.trim().toLowerCase();
  if (!n || !labels.length) return null;
  const exact = labels.find((l) => l.toLowerCase() === n);
  if (exact) return exact;
  const firstPart = n.split(",")[0]?.trim();
  if (firstPart) {
    const match = labels.find((l) => l.toLowerCase() === firstPart);
    if (match) return match;
  }
  const wordMatch = labels.find((l) => {
    const label = l.toLowerCase();
    return n === label || n.startsWith(`${label},`) || n.endsWith(`, ${label}`);
  });
  return wordMatch || null;
}

// ─── Night overrides from chat ────────────────────────────────────────────────

export function extractNightOverrides(
  brief: TripBrief,
  labels: string[],
  refinementNotes?: string
): NightOverride[] {
  const raw = refinementNotes?.trim() || "";
  if (!raw) return [];

  const overrides = new Map<string, string>();

  for (const line of raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const dateMatch = line.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-]\d{2,4})?\s*[-–:=>]+\s*(.+)$/i);
    if (dateMatch) {
      const day = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const base = resolveToKnown(dateMatch[3]?.trim() || "", labels);
      if (!base) continue;
      const date = resolveOverrideDate(brief, day, month);
      if (date) overrides.set(date, base);
      continue;
    }

    const dayNumMatch = line.match(/^d[ií]a\s*(\d+)\s*(?:en|:|-)\s*(.+)$/i);
    if (dayNumMatch) {
      const dayNum = Number(dayNumMatch[1]);
      const base = resolveToKnown(dayNumMatch[2]?.trim() || "", labels);
      const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
      if (!base || dayNum < 1 || dayNum > totalDays) continue;
      overrides.set(addDaysToIso(brief.startDate, dayNum - 1), base);
    }
  }

  return Array.from(overrides.entries()).map(([date, base]) => ({ date, base }));
}

function resolveOverrideDate(brief: TripBrief, day: number, month: number): string | null {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  for (let i = 0; i < totalDays; i += 1) {
    const iso = addDaysToIso(brief.startDate, i);
    const d = new Date(`${iso}T12:00:00Z`);
    if (d.getUTCDate() === day && d.getUTCMonth() + 1 === month) return iso;
  }
  return null;
}

export function buildSkeletonFromNightOverrides(
  brief: TripBrief,
  overrides: NightOverride[],
  labels: string[]
): TripSkeleton {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const overrideMap = new Map(overrides.map((item) => [item.date, item.base]));
  const baseByDay: string[] = [];
  let lastBase = labels[0] || "Destino";

  for (let idx = 0; idx < totalDays; idx += 1) {
    const date = addDaysToIso(brief.startDate, idx);
    const forced = overrideMap.get(date);
    if (forced) lastBase = forced;
    baseByDay.push(forced || lastBase);
  }

  const days: SkeletonDay[] = baseByDay.map((base, idx) => {
    const dayNum = idx + 1;
    const prevBase = idx > 0 ? baseByDay[idx - 1]! : null;
    const isTransfer = prevBase !== null && prevBase.toLowerCase() !== base.toLowerCase();
    const isArrival = dayNum === 1;
    const isDeparture = dayNum === totalDays;
    const dayType: SkeletonDayType = isArrival
      ? "arrival"
      : isDeparture
        ? "departure"
        : isTransfer
          ? "transfer_scenic"
          : "full";

    return {
      dayNum,
      date: addDaysToIso(brief.startDate, idx),
      dayType,
      base,
      summary: defaultSummaryForDay(dayType, brief, prevBase, base),
      transferFrom: isTransfer ? prevBase : null,
      transferTo: isTransfer ? base : null,
      mainActivities: [],
      availableHours: isArrival ? 2 : isDeparture ? 4 : isTransfer ? 6 : 9,
      notes: null,
    };
  });

  return {
    days,
    stays: staysFromDays(days),
    reasoning: "Esqueleto ajustado según las noches pedidas en el chat.",
  };
}

function applyNightOverrides(days: SkeletonDay[], brief: TripBrief, overrides: NightOverride[]): SkeletonDay[] {
  if (!overrides.length) return days;
  const overrideMap = new Map(overrides.map((item) => [item.date, item.base]));

  return days.map((day, idx, arr) => {
    const forcedBase = overrideMap.get(day.date);
    if (!forcedBase) return day;

    const base = forcedBase;
    const prevBase = idx > 0 ? overrideMap.get(arr[idx - 1]!.date) || arr[idx - 1]!.base : null;
    const isArrival = day.dayNum === 1;
    const isDeparture = day.dayNum === arr.length;
    const isTransfer = !isArrival && !isDeparture && prevBase !== null && prevBase.toLowerCase() !== base.toLowerCase();
    const dayType: SkeletonDayType = isArrival
      ? "arrival"
      : isDeparture
        ? "departure"
        : isTransfer
          ? "transfer_scenic"
          : "full";

    return {
      ...day,
      base,
      dayType,
      transferFrom: isTransfer ? prevBase : null,
      transferTo: isTransfer ? base : null,
      summary: defaultSummaryForDay(dayType, brief, prevBase, base),
    };
  });
}

function defaultSummaryForDay(
  dayType: SkeletonDayType,
  brief: TripBrief,
  transferFrom: string | null,
  base: string
): string {
  if (dayType === "arrival") return `Llegada${brief.arrival.time ? ` a las ${brief.arrival.time}` : ""} y descanso.`;
  if (dayType === "departure") return "Último día. Margen para salida.";
  if (dayType === "transfer_scenic" || dayType === "transfer_practical") {
    return `Traslado ${transferFrom || "base anterior"} → ${base}.`;
  }
  if (dayType === "rest") return `Día tranquilo en ${base}.`;
  return `Día completo en ${base}.`;
}

// ─── Fallback skeleton ────────────────────────────────────────────────────────

export function buildFallbackSkeleton(
  brief: TripBrief,
  stops: GeoStop[],
  opts?: GenerateSkeletonOptions
): TripSkeleton {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const labels = brief.sleepBases.length ? [...brief.sleepBases] : stops.map((s) => s.label);
  const nightOverrides = extractNightOverrides(brief, labels, opts?.refinementNotes);
  if (!labels.length) labels.push("Destino");

  if (nightOverrides.length) {
    return buildSkeletonFromNightOverrides(brief, nightOverrides, labels);
  }

  const baseByDay: string[] = [];
  const nightsEach = Math.max(1, Math.floor(totalDays / labels.length));
  for (const label of labels) {
    for (let i = 0; i < nightsEach; i++) baseByDay.push(label);
  }
  while (baseByDay.length < totalDays) baseByDay.push(labels[labels.length - 1]!);
  baseByDay.splice(totalDays);

  const days: SkeletonDay[] = baseByDay.map((base, idx) => {
    const dayNum = idx + 1;
    const prevBase = idx > 0 ? baseByDay[idx - 1]! : null;
    const isTransfer = prevBase !== null && prevBase.toLowerCase() !== base.toLowerCase();
    const isArrival = dayNum === 1;
    const isDeparture = dayNum === totalDays;
    const dayType: SkeletonDayType = isArrival
      ? "arrival"
      : isDeparture
        ? "departure"
        : isTransfer
          ? "transfer_scenic"
          : "full";
    return {
      dayNum,
      date: addDaysToIso(brief.startDate, idx),
      dayType,
      base,
      summary: defaultSummaryForDay(dayType, brief, prevBase, base),
      transferFrom: isTransfer ? prevBase : null,
      transferTo: isTransfer ? base : null,
      mainActivities: [],
      availableHours: isArrival ? 2 : isDeparture ? 4 : isTransfer ? 6 : 9,
      notes: null,
    };
  });

  return { days, stays: staysFromDays(days), reasoning: "fallback" };
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateSkeleton(
  brief: TripBrief,
  opts?: GenerateSkeletonOptions
): Promise<{
  skeleton: TripSkeleton;
  stops: GeoStop[];
  skeletonText: string;
}> {
  const stops = await geocodeDestinations(brief);
  if (!stops.length) {
    throw new Error("No se pudieron geocodificar los destinos.");
  }

  const labels = allowedLabels(brief, stops);
  const nightOverrides = extractNightOverrides(brief, labels, opts?.refinementNotes);
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);

  if (nightOverrides.length >= Math.max(1, totalDays - 1)) {
    const skeleton = buildSkeletonFromNightOverrides(brief, nightOverrides, labels);
    return { skeleton, stops, skeletonText: formatSkeletonForChat(skeleton) };
  }

  const prompt = buildArchitectPrompt(brief, stops, opts);

  try {
    const { text } = await askGeminiWithUsage(prompt, "planning", {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    });
    const parsed = extractJsonObject(text);
    const skeleton = parseArchitectResponse(parsed, brief, stops, opts);
    return { skeleton, stops, skeletonText: formatSkeletonForChat(skeleton) };
  } catch {
    const skeleton = buildFallbackSkeleton(brief, stops, opts);
    return { skeleton, stops, skeletonText: formatSkeletonForChat(skeleton) };
  }
}

// ─── Format for chat ──────────────────────────────────────────────────────────

const DAY_TYPE_LABEL: Record<SkeletonDayType, string> = {
  arrival: "Llegada",
  departure: "Salida",
  full: "Día completo",
  transfer_scenic: "Traslado con paradas",
  transfer_practical: "Traslado",
  rest: "Descanso",
};

export function formatSkeletonForChat(skeleton: TripSkeleton): string {
  const lines: string[] = ["Así organizaría el viaje:", ""];
  if (skeleton.reasoning && skeleton.reasoning !== "fallback") {
    lines.push(skeleton.reasoning, "");
  }
  for (const d of skeleton.days) {
    const type = DAY_TYPE_LABEL[d.dayType] || d.dayType;
    const transfer = d.transferFrom && d.transferTo ? ` · ${d.transferFrom} → ${d.transferTo}` : "";
    lines.push(`Día ${d.dayNum} · ${d.date} · ${type} · duermes en ${d.base}${transfer}`);
    if (d.summary) lines.push(`  ${d.summary}`);
    if (d.mainActivities.length) lines.push(`  Ancla: ${d.mainActivities.join(" · ")}`);
    lines.push("");
  }
  lines.push("Si quieres cambiar noches, bases o el eje de un día, dímelo. Si te encaja, genero el itinerario detallado.");
  return lines.join("\n").trim();
}
