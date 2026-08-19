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
      return null;
    })
  );
  return results.filter((r): r is GeoStop => r !== null);
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

export function buildArchitectPrompt(brief: TripBrief, stops: GeoStop[]): string {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const stopLabels = stops.map((s) => s.label);
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
1. Cada "base" DEBE ser exactamente una de: ${stopLabels.join(", ")}. PROHIBIDO variaciones como "Cafayate, Salta".
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

Distancias:
${legs || "- sin pares de ciudades"}

Viaje:
- Fechas: ${brief.startDate} → ${brief.endDate} (${totalDays} días)
- Bases: ${stopLabels.join(", ")}
- Transporte: ${brief.transport || "sin especificar"}
- Viajeros: ${brief.travelersType || "sin especificar"}${brief.travelerCount ? ` (${brief.travelerCount})` : ""}
${brief.freeText ? `- Notas: ${brief.freeText}` : ""}
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

export function parseArchitectResponse(raw: unknown, brief: TripBrief, stops: GeoStop[]): TripSkeleton {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const labels = stops.map((s) => s.label);

  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawDays = Array.isArray(data.days) ? data.days : [];

  const allLabels = [...new Set([...labels, ...brief.sleepBases])];

  const days: SkeletonDay[] = rawDays
    .map((row, idx) => {
      const d = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
      if (!d) return null;
      const rawBase = String(d.base ?? "").trim();
      const base = resolveToKnown(rawBase, allLabels) || rawBase;
      if (!base) return null;
      return {
        dayNum: idx + 1,
        date: String(d.date ?? addDaysToIso(brief.startDate, idx)),
        dayType: normalizeDayType(d.dayType),
        base,
        summary: String(d.summary ?? `Día ${idx + 1} en ${base}.`),
        transferFrom: d.transferFrom ? (resolveToKnown(String(d.transferFrom), allLabels) || String(d.transferFrom).trim()) : null,
        transferTo: d.transferTo ? (resolveToKnown(String(d.transferTo), allLabels) || String(d.transferTo).trim()) : null,
        mainActivities: Array.isArray(d.mainActivities)
          ? (d.mainActivities as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 3)
          : [],
        availableHours: Math.max(0, Math.min(12, Number(d.availableHours) || 8)),
        notes: d.notes ? String(d.notes) : null,
      } satisfies SkeletonDay;
    })
    .filter((x): x is SkeletonDay => x !== null);

  if (days.length === totalDays) {
    return {
      days,
      stays: staysFromDays(days),
      reasoning: String(data.reasoning ?? "") || null,
    };
  }

  return buildFallbackSkeleton(brief, stops);
}

function resolveToKnown(name: string, labels: string[]): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = labels.find((l) => l.toLowerCase() === n);
  if (exact) return exact;
  const startsWith = labels.find((l) => n.startsWith(l.toLowerCase()));
  if (startsWith) return startsWith;
  const firstPart = n.split(",")[0]?.trim();
  if (firstPart) {
    const match = labels.find((l) => l.toLowerCase() === firstPart);
    if (match) return match;
  }
  return null;
}

// ─── Fallback skeleton ────────────────────────────────────────────────────────

export function buildFallbackSkeleton(brief: TripBrief, stops: GeoStop[]): TripSkeleton {
  const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
  const labels = brief.sleepBases.length ? [...brief.sleepBases] : stops.map((s) => s.label);
  if (!labels.length) labels.push("Destino");

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
      summary: isArrival
        ? `Llegada${brief.arrival.time ? ` a las ${brief.arrival.time}` : ""} y descanso.`
        : isDeparture
          ? `Último día. Margen para salida.`
          : isTransfer
            ? `Traslado ${prevBase} → ${base}.`
            : `Día completo en ${base}.`,
      transferFrom: isTransfer ? prevBase : null,
      transferTo: isTransfer ? base : null,
      mainActivities: [],
      availableHours: isArrival ? 1 : isDeparture ? 4 : isTransfer ? 6 : 9,
      notes: null,
    };
  });

  return { days, stays: staysFromDays(days), reasoning: "fallback" };
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateSkeleton(brief: TripBrief): Promise<{
  skeleton: TripSkeleton;
  stops: GeoStop[];
  skeletonText: string;
}> {
  const stops = await geocodeDestinations(brief);
  if (!stops.length) {
    throw new Error("No se pudieron geocodificar los destinos.");
  }

  const prompt = buildArchitectPrompt(brief, stops);

  try {
    const { text } = await askGeminiWithUsage(prompt, "planning", {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    });
    const parsed = extractJsonObject(text);
    const skeleton = parseArchitectResponse(parsed, brief, stops);
    return { skeleton, stops, skeletonText: formatSkeletonForChat(skeleton) };
  } catch {
    const skeleton = buildFallbackSkeleton(brief, stops);
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
