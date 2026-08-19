/**
 * Phase 2: Trip Detailer.
 * Takes a confirmed TripSkeleton + TripBrief and produces a full TripItinerary in ONE Gemini call.
 */

import { askGeminiWithUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { TripBrief, TripSkeleton, TripDay, TripActivity, ActivityKind } from "./types";

// ─── Build prompt ─────────────────────────────────────────────────────────────

export function buildDetailPrompt(
  brief: TripBrief,
  skeleton: TripSkeleton,
  opts?: { refinementNotes?: string; previousDays?: TripDay[] | null }
): string {
  const skeletonJson = JSON.stringify(skeleton.days, null, 2);
  const previousJson =
    opts?.previousDays && opts.previousDays.length ? JSON.stringify(opts.previousDays, null, 2) : null;

  return `Eres un planificador de viajes experto. Rellena el itinerario COMPLETO para este viaje.

ESQUELETO CONFIRMADO (NO cambies bases, noches ni orden de días):
${skeletonJson}

Para cada día, genera actividades concretas con horarios realistas. Devuelve SOLO JSON válido:
{
  "days": [{
    "dayNum": 1,
    "date": "YYYY-MM-DD",
    "base": "Ciudad",
    "summary": "Resumen del día",
    "activities": [{
      "title": "Nombre propio del lugar o actividad",
      "description": "1-2 frases de qué se hace ahí",
      "time": "09:00",
      "durationMinutes": 90,
      "kind": "culture|nature|viewpoint|neighborhood|market|excursion|gastro|shopping|night|transport|rest",
      "placeName": "Nombre del establecimiento o lugar"
    }]
  }]
}

REGLAS:
1. RESPETA el esqueleto: mismas bases, mismos dayTypes, mismos días.
2. Los días de llegada (arrival) con hora tardía: solo actividad de descanso/cena cerca del hotel.
3. Los días de salida (departure): pocas actividades, margen para el aeropuerto.
4. Los traslados (transfer_scenic): paradas SOBRE la ruta, no desvíos.
5. Horarios realistas: desayuno 08:00-09:00, actividades desde 09:30, comida 13:00-14:30, cena 20:30-21:30.
6. "time" en formato HH:MM. Cada actividad empieza cuando la anterior termina + desplazamiento.
7. Nombres propios REALES: museos, parques, restaurantes, miradores que EXISTEN. No inventes.
8. "kind" debe ser coherente con la actividad.
9. Si el esqueleto tiene mainActivities, INCLÚYELAS obligatoriamente en ese día.
10. Máximo 5-7 actividades por día completo, 2-3 en llegada/salida, 3-5 en traslado.
11. Incluye al menos 1 restaurante/bar para comer y otro para cenar en días completos.
${brief.interests.length ? `12. Estilo del viajero: ${brief.interests.join(", ")}.` : ""}
${brief.avoid.length ? `13. EVITAR: ${brief.avoid.join(", ")}.` : ""}
${brief.constraints.length ? `14. Restricciones: ${brief.constraints.join("; ")}.` : ""}
15. Devuelve actividades para TODOS los días. PROHIBIDO dejar un día con "activities": [] salvo que sea imposible y expliques claramente por qué.
16. Si te paso peticiones de cambio, modifica SOLO lo necesario y conserva lo demás.
- Transporte: ${brief.transport || "sin especificar"}
- Ritmo: ${brief.pace || "balanced"}
- Viajeros: ${brief.travelersType || "sin especificar"}${brief.travelerCount ? ` (${brief.travelerCount})` : ""}
${brief.freeText ? `- Notas adicionales: ${brief.freeText}` : ""}
${opts?.refinementNotes ? `- Cambios pedidos por el usuario: ${opts.refinementNotes}` : ""}
${previousJson ? `- Itinerario anterior a conservar salvo cambios concretos:\n${previousJson}` : ""}`;
}

// ─── Parse response ───────────────────────────────────────────────────────────

const VALID_KINDS = new Set<ActivityKind>([
  "culture", "nature", "viewpoint", "neighborhood", "market",
  "excursion", "gastro", "shopping", "night", "transport", "rest",
]);

function normalizeKind(v: unknown): ActivityKind {
  const s = String(v ?? "").trim().toLowerCase();
  if (VALID_KINDS.has(s as ActivityKind)) return s as ActivityKind;
  if (s.includes("gastro") || s.includes("restaurant") || s.includes("food")) return "gastro";
  if (s.includes("natur") || s.includes("park")) return "nature";
  if (s.includes("cultur") || s.includes("museum")) return "culture";
  return "culture";
}

function normalizeTime(v: unknown): string | null {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseDetailResponse(
  raw: unknown,
  skeleton: TripSkeleton,
  previousDays?: TripDay[] | null
): TripDay[] {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawDays = Array.isArray(data.days) ? data.days : [];
  const previousByDay = new Map((previousDays || []).map((day) => [day.dayNum, day]));

  const days: TripDay[] = skeleton.days.map((sd, idx) => {
    const rd = rawDays[idx];
    const dayData = rd && typeof rd === "object" ? (rd as Record<string, unknown>) : null;
    const rawActivities = dayData && Array.isArray(dayData.activities) ? dayData.activities : [];

    const activities: TripActivity[] = rawActivities
      .map((act): TripActivity | null => {
        const a = act && typeof act === "object" ? (act as Record<string, unknown>) : null;
        if (!a) return null;
        const title = String(a.title ?? "").trim();
        if (!title) return null;
        return {
          title,
          description: a.description ? String(a.description).trim() : null,
          time: normalizeTime(a.time),
          durationMinutes: Number(a.durationMinutes) || null,
          kind: normalizeKind(a.kind),
          placeName: a.placeName ? String(a.placeName).trim() : title,
          lat: null,
          lng: null,
          geocodeStatus: "pending",
        };
      })
      .filter((x): x is TripActivity => x !== null);

    const previous = previousByDay.get(sd.dayNum);
    const safeActivities = activities.length ? activities : previous?.activities || [];

    return {
      dayNum: sd.dayNum,
      date: sd.date,
      base: sd.base,
      summary: dayData?.summary ? String(dayData.summary) : previous?.summary || sd.summary,
      activities: safeActivities,
    };
  });

  return days;
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateDetail(
  brief: TripBrief,
  skeleton: TripSkeleton,
  opts?: { refinementNotes?: string; previousDays?: TripDay[] | null }
): Promise<TripDay[]> {
  const prompt = buildDetailPrompt(brief, skeleton, opts);

  const { text } = await askGeminiWithUsage(prompt, "planning", {
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  });

  const parsed = extractJsonObject(text);
  return parseDetailResponse(parsed, skeleton, opts?.previousDays);
}
