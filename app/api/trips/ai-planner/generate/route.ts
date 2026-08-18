import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import {
  geocodePhotonPreferred,
  geocodeTripAnchor,
  regionHintsFromDestination,
} from "@/lib/geocoding/photonGeocode";
import { addDaysIso } from "@/lib/trip-ai/tripCreationDates";
import { askGemini } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import {
  architectureFromStays,
  coerceTripArchitecture,
  formatTripArchitectureForChat,
  omittedSleepBases,
  planTripArchitecture,
  remapArchitectureToKnownStops,
  type ArchitectDay,
  type TripArchitecture,
} from "@/lib/trip-ai/plannerArchitect";
import { generateWholeTripItinerary } from "@/lib/trip-ai/plannerWholeTrip";
import {
  buildFallbackDaysFromPool,
  buildInCityItem,
  countRealItems,
  dedupeDaysAcrossTrip,
  dedupeDaysInCityBlock,
  fillSparseDaysInBlock,
  mergePlannerDaysWithFallback,
  type NearbyPoi,
  type PlannerDay,
  type PlannerDayItem,
} from "@/lib/trip-ai/itineraryDedup";
import { shouldKeepPoiOnTransferDay, minSightsForDriveHours, scheduleAlongTransfer } from "@/lib/trip-ai/plannerTransferSights";
import {
  clipItemsToDayWindow,
  itemFitsWindow,
  parseClockFromNotes,
  slotsAfter,
  windowForTripDay,
} from "@/lib/trip-ai/plannerDayWindows";
import {
  allowsNearbyExcursions,
  buildNearbyExcursionPromptLine,
  buildRestaurantPromptLine,
  buildStyleMixPromptLine,
  enrichNotesWithPlannerPrefs,
  parsePlannerPreferences,
  type PlannerPreferences,
} from "@/lib/trip-ai/plannerPreferences";
import { consolidateRestaurantsForDay } from "@/lib/trip-ai/restaurantPlans";
import { matchKnownStopLabel, planStaysToMinimizeDriving, repairStaysAvoidingLongHops, roundedDriveHours } from "@/lib/trip-ai/plannerStayRoute";
import { isSkippablePlace } from "@/lib/trip-ai/plannerChatStops";
import { normalizePlannerBrief } from "@/lib/trip-ai/plannerBrief";
import {
  PLANNER_CHUNK_CONCURRENCY,
  PLANNER_MAX_DAYS_MESSAGE,
  daysPerGeminiCall,
  plannerDaysTooLong,
} from "@/lib/trip-ai/plannerGenerateLimits";

export const runtime = "nodejs";
export const maxDuration = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

type LatLng = { lat: number; lng: number };
type Poi = {
  name: string;
  lat: number;
  lng: number;
  osm?: { type: string; id: string };
  tags?: Record<string, string>;
};

type Category =
  | "culture" | "nature" | "viewpoint" | "neighborhood"
  | "market" | "excursion" | "gastro_experience" | "shopping" | "night";

const ALL_CATEGORIES: Category[] = [
  "culture", "nature", "viewpoint", "neighborhood", "market",
  "excursion", "gastro_experience", "shopping", "night",
];

// ─── In-process caches ────────────────────────────────────────────────────────

// POI pool cache (from Overpass / Gemini POI fallback)
type CacheEntry = { pools: Record<Category, Poi[]>; expiresAt: number };
const POI_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function ck(c: LatLng, r: number) { return `${c.lat.toFixed(4)},${c.lng.toFixed(4)},${r}`; }
function cacheGet(c: LatLng, r: number) {
  const e = POI_CACHE.get(ck(c, r));
  if (!e) return null;
  if (Date.now() > e.expiresAt) { POI_CACHE.delete(ck(c, r)); return null; }
  return e.pools;
}
function cacheSet(c: LatLng, r: number, pools: Record<Category, Poi[]>) {
  POI_CACHE.set(ck(c, r), { pools, expiresAt: Date.now() + CACHE_TTL_MS });
  if (POI_CACHE.size > 200) { const now = Date.now(); for (const [k, v] of POI_CACHE) if (now > v.expiresAt) POI_CACHE.delete(k); }
}

type PlannerDayWithMeta = PlannerDay & { _raw_item_count?: number; _filtered_count?: number };

function emptyCategoryPools(): Record<Category, Poi[]> {
  return Object.fromEntries(ALL_CATEGORIES.map((cat) => [cat, []])) as unknown as Record<Category, Poi[]>;
}

// Itinerary cache — keyed by city + nights + notes hash
const ITIN_CACHE = new Map<string, { days: PlannerDayWithMeta[]; expiresAt: number }>();

function itinKey(city: string, nights: number, notes: string, prefs: PlannerPreferences) {
  return `v5:${city.toLowerCase().slice(0, 40)}:${nights}:${notes.toLowerCase().slice(0, 280)}:${prefs.nearbyExcursions}:${prefs.suggestRestaurants}:${prefs.restaurantBudget}`;
}
function itinCacheGet(city: string, nights: number, notes: string, prefs: PlannerPreferences) {
  const key = itinKey(city, nights, notes, prefs);
  const e = ITIN_CACHE.get(key);
  if (!e || Date.now() > e.expiresAt) { if (e) ITIN_CACHE.delete(key); return null; }
  return e.days;
}
function itinCacheSet(city: string, nights: number, notes: string, prefs: PlannerPreferences, days: PlannerDayWithMeta[]) {
  ITIN_CACHE.set(itinKey(city, nights, notes, prefs), { days, expiresAt: Date.now() + CACHE_TTL_MS });
  if (ITIN_CACHE.size > 80) { const now = Date.now(); for (const [k, v] of ITIN_CACHE) if (now > v.expiresAt) ITIN_CACHE.delete(k); }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanString(v: unknown) { return String(v ?? "").trim(); }
function isoOk(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function dedupeByName(rows: Poi[]): Poi[] {
  const seen = new Set<string>(); const out: Poi[] = [];
  for (const r of rows) { const k = r.name.trim().toLowerCase(); if (!k || seen.has(k)) continue; seen.add(k); out.push(r); }
  return out;
}
function pickN<T>(arr: T[], n: number): T[] { return arr.slice(0, n); }
function dayCountBetween(start: string, end: string) {
  const a = new Date(`${start}T12:00:00Z`).getTime(), b = new Date(`${end}T12:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1;
  return Math.max(1, Math.round((b - a) / (86400 * 1000)) + 1);
}
function minutesToRuleClock(total: number) {
  const h = Math.max(0, Math.min(23, Math.floor(total / 60)));
  const min = Math.max(0, Math.min(59, total % 60));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function sumPools(p: Record<Category, Poi[]>) { return ALL_CATEGORIES.reduce((n, k) => n + (p[k]?.length || 0), 0); }

function parseGeminiPoiFallback(raw: string, limit = 24): Record<Category, Poi[]> | null {
  let parsed: unknown = null;
  try {
    parsed = extractJsonObject(raw);
  } catch {
    return null;
  }
  const pools = emptyCategoryPools();
  const pushPoi = (cat: Category, row: unknown) => {
    if (!row || typeof row !== "object") return;
    const rec = row as Record<string, unknown>;
    const name = cleanString(rec.name || rec.title || rec.place);
    const lat = typeof rec.lat === "number" ? rec.lat : Number(rec.lat);
    const lng =
      typeof rec.lng === "number"
        ? rec.lng
        : typeof rec.lon === "number"
          ? rec.lon
          : Number(rec.lng ?? rec.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (pools[cat].some((poi) => poi.name.toLowerCase() === name.toLowerCase())) return;
    if (pools[cat].length >= limit) return;
    pools[cat].push({ name, lat, lng });
  };
  if (Array.isArray(parsed)) {
    for (const row of parsed) pushPoi("culture", row);
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const cat of ALL_CATEGORIES) {
      const rows = obj[cat];
      if (Array.isArray(rows)) for (const row of rows) pushPoi(cat, row);
    }
    if (Array.isArray(obj.places)) {
      for (const row of obj.places) {
        const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
        const category = cleanString(rec?.category).toLowerCase();
        const cat = (ALL_CATEGORIES as string[]).includes(category) ? (category as Category) : "culture";
        pushPoi(cat, row);
      }
    }
  }
  if (!sumPools(pools)) return null;
  const excursionSeed = [...pools.nature, ...pools.culture, ...pools.viewpoint];
  for (const poi of excursionSeed) {
    if (pools.excursion.length >= limit) break;
    if (pools.excursion.some((it) => it.name.toLowerCase() === poi.name.toLowerCase())) continue;
    pools.excursion.push(poi);
  }
  return pools;
}

// ─── Notes helpers ────────────────────────────────────────────────────────────

function mergeNotes(freeText: string, rulesRaw: unknown): string {
  const rules = Array.isArray(rulesRaw)
    ? rulesRaw.map((x) => cleanString(x)).filter(Boolean)
    : [];
  const base = cleanString(freeText);
  if (!rules.length) return base;
  return `CAMBIOS OBLIGATORIOS del viajero (prioridad máxima, aplícalos en el itinerario): ${rules.join(" | ")}.${base ? ` Contexto original: ${base}` : ""}`;
}

// ─── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  return R * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2));
}

// ─── Smart day distribution ───────────────────────────────────────────────────

type StayProposal = { stop: string; nights: number; reason: string };

function distributeNightsSmart(
  stops: Array<{ label: string; center: LatLng }>,
  poisByStop: Record<string, Record<Category, Poi[]>>,
  totalDays: number,
  notes: string
): StayProposal[] {
  if (!stops.length) return [];
  if (stops.length === 1) return [{ stop: stops[0]!.label, nights: totalDays, reason: `${totalDays} días para explorar a fondo` }];
  const prefs = notes.toLowerCase();
  const tourismW = stops.map((s) => { const p = poisByStop[s.label]; const raw = (p?.culture?.length || 0) * 1.2 + (p?.market?.length || 0) + (p?.nature?.length || 0) * 0.9 + (p?.gastro_experience?.length || 0) * 0.8 + (p?.viewpoint?.length || 0) * 0.6; return Math.log1p(Math.max(1, raw)); });
  const transitPenalty = stops.map((s, i) => { if (i === 0) return 0; const km = haversineKm(stops[i - 1]!.center, s.center); return (km / 500) * 0.5; });
  const prefBoost = stops.map((s) => { const p = poisByStop[s.label]; let b = 0; if ((p?.nature?.length || 0) > 5 && /naturaleza|senderismo|parque|monta[ñn]a|trekking|outdoor|aire libre/i.test(prefs)) b += 0.4; if ((p?.gastro_experience?.length || 0) > 2 && /gastronom[ií]a|comida|vino|bodega|cocina/i.test(prefs)) b += 0.3; if ((p?.culture?.length || 0) > 8 && /cultura|historia|museo|arte|arquitectura/i.test(prefs)) b += 0.3; return b; });
  const scores = stops.map((_, i) => Math.max(0.1, tourismW[i]! + prefBoost[i]!));
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const availableDays = Math.max(stops.length, totalDays - Math.round(transitPenalty.reduce((a, b) => a + b, 0)));
  let nights = scores.map((s) => Math.max(1, Math.round((s / totalScore) * availableDays)));
  transitPenalty.forEach((pen, i) => { if (pen >= 0.5 && i > 0) nights[i] = Math.max(nights[i]!, 2); });
  let sum = nights.reduce((a, b) => a + b, 0);
  const sortedIdx = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]!);
  while (sum < totalDays) { nights[sortedIdx[sum % sortedIdx.length]!]! += 1; sum++; }
  while (sum > totalDays) { const idx = sortedIdx.slice().reverse().find((i) => nights[i]! > 1); if (idx === undefined) break; nights[idx]! -= 1; sum--; }
  return stops.map((s, i) => {
    const n = nights[i]!, isBig = tourismW[i]! > Math.log1p(15), isNature = (poisByStop[s.label]?.nature?.length || 0) > (poisByStop[s.label]?.culture?.length || 0), farLeg = transitPenalty[i]! >= 0.5;
    const parts = [isBig ? "ciudad con mucho que ver" : isNature ? "destino natural" : "ciudad compacta", farLeg ? "incluye día de traslado" : "", prefBoost[i]! > 0.3 ? "ajustado a tus preferencias" : ""].filter(Boolean);
    return { stop: s.label, nights: n, reason: `${n} día${n !== 1 ? "s" : ""} — ${parts.join(", ")}` };
  });
}

// ─── Viability check ──────────────────────────────────────────────────────────

export type ViabilityResult = { viable: boolean; warning: string; suggestions: Array<{ stops: string[]; reason: string }> };

function checkViability(stops: Array<{ label: string; center: LatLng }>, totalDays: number, poisByStop: Record<string, Record<Category, Poi[]>>): ViabilityResult | null {
  if (stops.length <= 1) return null;
  let minDaysNeeded = stops.length;
  for (let i = 1; i < stops.length; i++) { const km = haversineKm(stops[i - 1]!.center, stops[i]!.center); if (km > 300) minDaysNeeded++; if (km > 800) minDaysNeeded++; }
  if (totalDays >= minDaysNeeded) return null;
  const scored = stops.map((s) => { const p = poisByStop[s.label]; return { label: s.label, center: s.center, w: (p?.culture?.length || 0) + (p?.nature?.length || 0) + (p?.market?.length || 0) }; }).sort((a, b) => b.w - a.w);
  const suggestions: ViabilityResult["suggestions"] = [];
  if (totalDays >= 2) suggestions.push({ stops: [scored[0]!.label], reason: `${totalDays} días solo en ${scored[0]!.label} — tiempo suficiente para verlo bien` });
  if (totalDays >= 3 && scored.length >= 2) { const km = haversineKm(scored[0]!.center, scored[1]!.center); if (km < 600) suggestions.push({ stops: [scored[0]!.label, scored[1]!.label], reason: `${scored[0]!.label} + ${scored[1]!.label} — cerca (${Math.round(km)} km)` }); }
  if (totalDays >= 3 && scored.length >= 3) suggestions.push({ stops: [scored[0]!.label, scored[scored.length - 1]!.label], reason: `Empieza en ${scored[0]!.label} y termina en ${scored[scored.length - 1]!.label}` });
  return { viable: false, warning: `Con ${totalDays} día${totalDays !== 1 ? "s" : ""} y ${stops.length} destinos, el viaje está muy justo (mínimo ${minDaysNeeded} días recomendados).`, suggestions: suggestions.slice(0, 3) };
}

// ─── Gemini: itinerary for a city block ───────────────────────────────────────
//
// The core of the new approach:
// Ask Gemini "qué ver y hacer en X lugar, Y días" with full user context.
// This produces expert-quality, varied, location-specific plans that improve
// with every chat message the user sends.

// Días por llamada: ver daysPerGeminiCall (viajes largos agrupan más para no timeout).

// Normalize Gemini activity_kind typos to valid values
const KIND_ALIASES: Record<string, string> = {
  gastronomy_experience: "gastro_experience",
  gastronomy: "gastro_experience",
  food: "gastro_experience",
  eat: "gastro_experience",
  restaurant: "gastro_experience",
  adventure: "excursion",
  hike: "nature",
  trek: "nature",
  walk: "nature",
  sight: "culture",
  historic: "culture",
  landmark: "culture",
};
function normalizeKind(raw: string): string {
  const k = (raw || "").toLowerCase().trim();
  return KIND_ALIASES[k] ?? k;
}

// Compact field mapping — Gemini outputs short keys, parser expands them
// Saves ~60% tokens vs verbose JSON: 1 day with 5 activities = ~600 tokens (was ~1800)
// t = title, d = tip (short description ≤10 words), h = time (HH:MM), k = kind, lt = lat, lg = lng
// address and activity_type are NOT requested — generated locally by the parser

function itemIsCloserToOtherBase(
  lat: number,
  lng: number,
  cityCenter: LatLng | null,
  otherStops: Array<{ label: string; center: LatLng }>
): boolean {
  if (!cityCenter || !otherStops.length) return false;
  const here = haversineKm({ lat, lng }, cityCenter);
  for (const other of otherStops) {
    const there = haversineKm({ lat, lng }, other.center);
    if (there + 30 < here && here > 50) return true;
  }
  return false;
}

function buildCityItineraryPrompt(
  city: string,
  days: Array<{ dayNum: number; date: string; architecture?: ArchitectDay | null }>,
  notes: string,
  prevCity: string | null,
  opts?: {
    usedPlaces?: string[];
    dayIndexInBlock?: number;
    totalDaysInBlock?: number;
    totalTripDays?: number;
    nearbyExcursionHints?: string[];
    plannerPrefs?: PlannerPreferences;
    otherBases?: string[];
    arrivalTime?: string | null;
    departureTime?: string | null;
  }
): string {
  const profile = notes.trim()
    ? `Preferencias e instrucciones del viajero (OBLIGATORIAS): "${notes}"`
    : "";

  const transitNote = prevCity && days[0]?.dayNum === 1
    ? `Día de traslado desde ${prevCity} hasta ${city}. Las visitas SOLO pueden ser paradas SOBRE la ruta ${prevCity} → ${city} o a la llegada. PROHIBIDO programar a las 09:30 un sitio del destino si el coche tarda más de 2 h. No llenes el día como si ya estuvieras en ${city}.`
    : "";

  const dateList = days.map((d) => `${d.dayNum}:${d.date}`).join(" ");
  const firstDate = days[0]?.date ?? "";
  const architectBlock = days
    .map((d) => {
      const a = d.architecture;
      if (!a) return null;
      const anchors = a.mainActivities.length ? ` | anclas: ${a.mainActivities.join(", ")}` : "";
      return `\n- Día ${d.dayNum} (${d.date}) [${a.dayType}] base ${a.base}: ${a.summary}${anchors}${a.notes ? ` | nota: ${a.notes}` : ""}`;
    })
    .filter(Boolean)
    .join("");
  const dayIdx = opts?.dayIndexInBlock ?? 1;
  const totalInBlock = opts?.totalDaysInBlock ?? 1;
  const used = (opts?.usedPlaces || []).filter(Boolean).slice(-35);
  const usedBlock =
    used.length > 0
      ? `\nYA PROGRAMADOS en días anteriores (PROHIBIDO repetir el mismo lugar/atracción): ${used.join("; ")}.`
      : "";
  const multiDayNote =
    dayIdx > 1
      ? `\nSolo repite un lugar si el viajero lo pidió en preferencias o es un recinto que necesita VARIOS DÍAS (ej. parque temático, parque nacional grande).`
      : "";
  const prefs = opts?.plannerPrefs;
  const excursionHints = (opts?.nearbyExcursionHints || []).slice(0, 12);
  const excursionBlock =
    dayIdx > 1 && prefs
      ? buildNearbyExcursionPromptLine(city, prefs, dayIdx, excursionHints)
      : dayIdx > 1 && excursionHints.length
        ? `\nSi ya cubriste lo esencial de ${city}, prioriza excursión de 1 día (k=excursion) a: ${excursionHints.join(", ")}.`
        : dayIdx > 1
          ? `\nSi agotaste ${city}, propón excursión de 1 día a pueblo, costa o lugar cercano verificable (k=excursion).`
          : "";
  const styleMixBlock = prefs ? buildStyleMixPromptLine(prefs) : "";
  const restaurantBlock = prefs ? buildRestaurantPromptLine(prefs) : "";
  const dayWindow = windowForTripDay({
    dayIndex: dayIdx,
    totalDays: opts?.totalTripDays ?? totalInBlock,
    arrivalTime: opts?.arrivalTime,
    departureTime: opts?.departureTime,
  });
  const arrivalRule =
    dayIdx === 1 && opts?.arrivalTime
      ? `\nLlegada el primer día a las ${opts.arrivalTime}. PROHIBIDO programar visitas antes de ${minutesToRuleClock(dayWindow.earliestMin)}. Si la llegada es a partir de las 18:00, deja 0-1 visita turística real como máximo.`
      : "";
  const departureRule =
    dayIdx === totalInBlock && opts?.departureTime
      ? `\nSalida el último día a las ${opts.departureTime}. PROHIBIDO programar actividades después de ${minutesToRuleClock(dayWindow.latestMin)} y deja margen realista para ir al aeropuerto o estación.`
      : "";

  const iconicRule =
    dayIdx === 1
      ? `8. Día 1 en ${city}: prioriza lo más icónico e imprescindible.`
      : `8. Día ${dayIdx}/${totalInBlock}: lugares DISTINTOS a los ya programados; barrios, museos o rutas que no hayas usado.`;
  const otherBases = (opts?.otherBases || []).filter((b) => {
    const n = b.trim().toLowerCase();
    return n && n !== city.trim().toLowerCase() && n !== (prevCity || "").trim().toLowerCase();
  });
  const otherBasesRule = otherBases.length
    ? prevCity && days[0]?.dayNum === 1
      ? `10. Prioriza la ruta ${prevCity} → ${city} y ${city}. PROHIBIDO lugares de: ${otherBases.join(", ")}.`
      : `10. Este bloque es SOLO ${city} en las fechas indicadas. PROHIBIDO lugares de: ${otherBases.join(", ")}.`
    : "";

  // Valid kinds listed once — Gemini copies them verbatim (saves tokens vs re-explaining)
  const kinds = "culture|nature|viewpoint|neighborhood|market|excursion|gastro_experience|shopping|night";

  return `Guía local experto de ${city}. Plan para ${prevCity && days[0]?.dayNum === 1 ? `el traslado ${prevCity} → ${city} y ${city}` : city} en: ${dateList}.
${profile}
${transitNote}${usedBlock}${multiDayNote}${excursionBlock}${styleMixBlock}${restaurantBlock}${arrivalRule}${departureRule}
${architectBlock ? `\nESQUELETO DEL TRAVEL ARCHITECT (OBLIGATORIO RESPETAR):${architectBlock}` : ""}

JSON COMPACTO — SOLO esto, sin markdown ni texto extra:
{"days":[{"day":1,"date":"${firstDate}","items":[{"t":"Nombre real","d":"Tip en max 8 palabras","h":"09:30","k":"culture","lt":-34.0000,"lg":-58.0000}]}]}

REGLAS:
1. "t": nombre propio real verificable en Google Maps. NUNCA genéricos.
2. "d": máximo 8 palabras. Tip práctico concreto.
3. "k": exactamente uno de: ${kinds}
4. "lt"/"lg": coordenadas GPS reales del lugar. Nunca 0.
5. "h": horario realista. Mínimo 2h entre anclas. Deja 13:00-14:30 libre para comer. No encadenes visitas sin margen de aparcamiento.
6. 2-4 items por día completo. EXCEPCIÓN llegada/salida: respeta el horario del vuelo o tren. EXCEPCIÓN traslado: 1-2 paradas en ruta como máximo si el coche supera las 4 h; nunca un día lleno en destino.
7. PROHIBIDO en "t": Almuerzo, Cena, Comida, Desayuno, Lunch, Dinner — solos o combinados. Gastronomía solo con nombre propio real. Máximo 1 bodega por día.
${iconicRule}
9. Respeta TODO lo que indicó el viajero. Si pidió naturaleza, la ancla del día es una EXCURSIÓN de paisaje con nombre propio, no un museo o plaza municipal.
${otherBasesRule}`.trim();
}

function poisToNearbyPool(pools: Record<Category, Poi[]> | undefined): NearbyPoi[] {
  if (!pools) return [];
  const raw = [...(pools.excursion || []), ...(pools.nature || []), ...(pools.culture || [])];
  return dedupeByName(raw).map((p) => ({ name: p.name, lat: p.lat, lng: p.lng }));
}

function resolveStopPools(
  poisByStop: Record<string, Record<Category, Poi[]>>,
  stopLabel: string
): Record<Category, Poi[]> | undefined {
  if (poisByStop[stopLabel]) return poisByStop[stopLabel];
  const lower = stopLabel.trim().toLowerCase();
  if (!lower) return undefined;
  for (const key of Object.keys(poisByStop)) {
    const k = key.toLowerCase();
    if (k === lower || k.startsWith(lower) || lower.startsWith(k)) return poisByStop[key];
  }
  for (const key of Object.keys(poisByStop)) {
    const k = key.toLowerCase();
    if (k.includes(lower) || lower.includes(k)) return poisByStop[key];
  }
  return undefined;
}

function matchKnownStop(name: string, stops: Array<{ label: string }>): string {
  return matchKnownStopLabel(name, stops.map((s) => s.label));
}

function syntheticCityPool(city: string, center?: LatLng | null): NearbyPoi[] {
  const lat = center?.lat ?? 0;
  const lng = center?.lng ?? 0;
  return [
    { name: `Casco histórico de ${city}`, lat, lng },
    { name: `Mirador de ${city}`, lat, lng },
    { name: `Mercado de ${city}`, lat, lng },
    { name: `Alrededores de ${city}`, lat, lng },
  ];
}

function arrivalRestItem(city: string, date: string, arrivalTime: string | null): PlannerDayItem {
  return {
    title: `Llegada a ${city} y noche`,
    description: arrivalTime
      ? `Llegada a las ${arrivalTime}. Traslado al alojamiento y descanso; sin visitas turísticas.`
      : `Día de llegada. Traslado al alojamiento y descanso.`,
    activity_date: date,
    activity_time: arrivalTime || "21:00",
    place_name: city,
    address: city,
    latitude: null,
    longitude: null,
    activity_kind: "rest",
    activity_type: "general",
    source: "ai_planner",
  };
}

function seedFromArchitecture(
  architectureDay: ArchitectDay | null,
  city: string,
  date: string,
  times: string[],
  center: LatLng | null
): PlannerDayItem[] {
  if (!architectureDay?.mainActivities?.length) return [];
  return architectureDay.mainActivities.slice(0, 3).map((name, i) => {
    const winery = /bodega|vino|cata|winery/i.test(name);
    return {
      title: name,
      description: architectureDay.summary || `Eje del día en ${city}.`,
      activity_date: date,
      activity_time: times[i] || FILL_TIMES[i] || "10:00",
      place_name: name,
      address: `${name}, ${city}`,
      latitude: center?.lat ?? null,
      longitude: center?.lng ?? null,
      activity_kind: winery ? "gastro_experience" : "excursion",
      activity_type: "visit",
      source: "ai_planner_architect",
    };
  });
}

function isWineryItem(it: PlannerDayItem): boolean {
  const t = `${it.title || ""} ${it.place_name || ""} ${it.activity_kind || ""}`.toLowerCase();
  return /bodega|winery|cata de vino|vi[ñn]edo/.test(t) || String(it.activity_kind || "") === "gastro_experience" && /vino|bodega|cata/.test(t);
}

function capWineries(days: PlannerDay[], maxTotal: number): PlannerDay[] {
  let kept = 0;
  return days.map((day) => ({
    ...day,
    items: (day.items || []).filter((it) => {
      if (!isWineryItem(it)) return true;
      if (kept >= maxTotal) return false;
      kept += 1;
      return true;
    }),
  }));
}

function airportBufferItem(city: string, date: string, departureTime: string): PlannerDayItem {
  return {
    title: `Margen al aeropuerto (${departureTime})`,
    description: `Salir con tiempo para devolver el coche, repostar y facturar. Vuelo o tren a las ${departureTime}.`,
    activity_date: date,
    activity_time: departureTime,
    place_name: city,
    address: city,
    latitude: null,
    longitude: null,
    activity_kind: "transport",
    activity_type: "general",
    source: "ai_planner",
  };
}

function poisToGastroPool(pools: Record<Category, Poi[]> | undefined): NearbyPoi[] {
  if (!pools) return [];
  return dedupeByName(pools.gastro_experience || []).map((p) => ({ name: p.name, lat: p.lat, lng: p.lng }));
}

function poisToInCityPool(pools: Record<Category, Poi[]> | undefined): NearbyPoi[] {
  if (!pools) return [];
  const raw = [
    ...(pools.culture || []),
    ...(pools.nature || []),
    ...(pools.viewpoint || []),
    ...(pools.neighborhood || []),
    ...(pools.market || []),
    ...(pools.gastro_experience || []),
  ];
  return dedupeByName(raw).map((p) => ({ name: p.name, lat: p.lat, lng: p.lng }));
}

const FILL_TIMES = ["10:00", "12:00", "15:30", "17:30"];
const TRANSFER_FILL_TIMES = ["11:00", "15:30", "17:30"];

function fillDayFromPools(
  items: PlannerDayItem[],
  date: string,
  city: string,
  pools: NearbyPoi[],
  used: Set<string>,
  minReal: number,
  times: string[] = FILL_TIMES,
  fallbackCenter?: LatLng | null
): PlannerDayItem[] {
  const out = [...items];
  if (minReal <= 0) return out;
  const onThisDay = new Set(
    out
      .filter((it) => String(it.activity_kind || "").toLowerCase() !== "transport")
      .map((it) => String(it.title || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const addPoi = (poi: NearbyPoi) => {
    const k = String(poi.name || "").trim().toLowerCase();
    if (!k || used.has(k) || onThisDay.has(k)) return false;
    const realNow = out.filter((it) => String(it.activity_kind || "").toLowerCase() !== "transport").length;
    const slots = times.length ? times : FILL_TIMES;
    const time = slots[Math.min(realNow, slots.length - 1)]!;
    out.push(buildInCityItem(poi, city, date, time));
    onThisDay.add(k);
    used.add(k);
    return true;
  };

  let real = out.filter((it) => String(it.activity_kind || "").toLowerCase() !== "transport").length;
  for (const poi of pools) {
    if (real >= minReal) break;
    if (addPoi(poi)) real += 1;
  }
  if (real < minReal) {
    for (const poi of syntheticCityPool(city, fallbackCenter)) {
      if (real >= minReal) break;
      if (addPoi(poi)) real += 1;
    }
  }
  return out;
}

async function generateCityItinerary(
  city: string,
  nights: number,
  startDateIso: string,
  notes: string,
  prevCity: string | null,
  forceRegen = false,
  excursionPool: NearbyPoi[] = [],
  inCityPool: NearbyPoi[] = [],
  gastroPool: NearbyPoi[] = [],
  plannerPrefs: PlannerPreferences = parsePlannerPreferences(null),
  geo?: {
    otherBases?: string[];
    cityCenter?: LatLng | null;
    prevCenter?: LatLng | null;
    otherStops?: Array<{ label: string; center: LatLng }>;
    tripStartDate?: string;
    tripEndDate?: string;
    totalDays?: number;
    arrivalTime?: string | null;
    departureTime?: string | null;
  },
  architectureDays: ArchitectDay[] = []
): Promise<{ days: PlannerDayWithMeta[]; prompt: string; rawOutput: string } | null> {
  if (!forceRegen) {
    const cached = itinCacheGet(city, nights, notes, plannerPrefs);
    if (cached) return { days: cached, prompt: "(from cache)", rawOutput: "(from cache)" };
  }

  // Tamaño de tanda según noches (un mes no debe encadenar 15 llamadas).
  const daysPerCall = daysPerGeminiCall(nights);
  const chunks: Array<Array<{ dayNum: number; date: string }>> = [];
  for (let i = 0; i < nights; i += daysPerCall) {
    chunks.push(
      Array.from({ length: Math.min(daysPerCall, nights - i) }, (_, j) => ({
        dayNum: i + j + 1,
        date: addDaysIso(startDateIso, i + j),
        architecture: architectureDays[i + j] ?? null,
      }))
    );
  }

  const MEAL_REGEX = /\b(almuerzo|cena|comida|desayuno|lunch|dinner|breakfast|brunch|merienda|aperitivo)\b/i;
  const GASTRO_OK = /\b(mercado|bodega|cata|taller|curso|winery|brewery|destiler[ií]a|vi[ñn]edo|maridaje|tapeo|pintxos|parrilla|asado)\b/i;
  const isMeal = (t: string) => MEAL_REGEX.test(t) && !GASTRO_OK.test(t);
  const isGeneric = (t: string) => /\b(paseo por|zona hist|tiempo libre|explorar el|visita panor)/i.test(t);

  // Parser: expand compact keys → full activity object
  function parseItems(rawItems: unknown[], date: string): PlannerDayItem[] {
    const out: PlannerDayItem[] = [];
    for (const raw of rawItems) {
      const it = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
      if (!it) continue;
      const title = cleanString(it.t || it.title || "");
      if (!title || isGeneric(title) || isMeal(title)) continue;
      const tip = cleanString(it.d || it.description || "") || null;
      const time = cleanString(it.h || it.activity_time || "") || null;
      const kind = normalizeKind(cleanString(it.k || it.activity_kind || "culture"));
      const lat = (() => {
        const v = it.lt ?? it.latitude;
        return typeof v === "number" && Math.abs(v) <= 90 && v !== 0 ? v : null;
      })();
      const lng = (() => {
        const v = it.lg ?? it.longitude;
        return typeof v === "number" && Math.abs(v) <= 180 && v !== 0 ? v : null;
      })();
      if (lat != null && lng != null) {
        const isTransferDay = Boolean(prevCity && date === startDateIso);
        const keep = isTransferDay
          ? shouldKeepPoiOnTransferDay(
              { lat, lng },
              geo?.cityCenter ?? null,
              geo?.prevCenter ?? null,
              geo?.otherStops || [],
              prevCity
            )
          : !itemIsCloserToOtherBase(lat, lng, geo?.cityCenter ?? null, geo?.otherStops || []);
        if (!keep) continue;
      }
      out.push({
        title,
        description: tip,
        activity_date: date,
        activity_time: time,
        place_name: title,
        address: `${title}, ${city}`,
        latitude: lat,
        longitude: lng,
        activity_kind: kind,
        activity_type: "visit",
        source: "ai_planner",
      });
    }
    return out;
  }

  const nearbyHints = allowsNearbyExcursions(plannerPrefs)
    ? excursionPool.map((p) => p.name).filter(Boolean)
    : [];
  const usedPlaces: string[] = [];
  const chunkResults: Array<{ days: PlannerDayWithMeta[]; prompt: string; rawOutput: string }> = [];

  async function runChunk(
    chunk: Array<{ dayNum: number; date: string; architecture?: ArchitectDay | null }>,
    priorUsed: string[],
    chunkIndex: number
  ): Promise<{ days: PlannerDayWithMeta[]; prompt: string; rawOutput: string }> {
    const firstDayNum = chunk[0]?.dayNum ?? 1;
    const prompt = buildCityItineraryPrompt(city, chunk, notes, chunkIndex === 0 ? prevCity : null, {
      usedPlaces: priorUsed,
      dayIndexInBlock: firstDayNum,
      totalDaysInBlock: nights,
      totalTripDays: geo?.totalDays,
      nearbyExcursionHints: firstDayNum > 1 ? nearbyHints : undefined,
      plannerPrefs,
      otherBases: geo?.otherBases,
      arrivalTime: geo?.arrivalTime ?? null,
      departureTime: geo?.departureTime ?? null,
    });
    let raw = "";
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        raw = await askGemini(prompt, "planning", {
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        });
        const parsed = extractJsonObject(raw) as { days?: Array<{ items?: unknown[] }> } | null;
        if (!parsed?.days || !Array.isArray(parsed.days)) continue;
        const days: PlannerDayWithMeta[] = parsed.days.map((d, idx) => {
          const date = chunk[idx]?.date ?? chunk[0]!.date;
          const rawItems = Array.isArray(d.items) ? d.items : [];
          const items = parseItems(rawItems, date);
          return {
            day: chunk[idx]?.dayNum ?? idx + 1,
            date,
            base: city,
            items,
            _raw_item_count: rawItems.length,
            _filtered_count: rawItems.length - items.length,
          };
        });
        return { days, prompt, rawOutput: raw };
      }
      return { days: [], prompt, rawOutput: raw };
    } catch (e) {
      logger.error(`[ai-planner] chunk ${chunkIndex} failed for "${city}":`, e);
      return { days: [], prompt, rawOutput: raw || String(e) };
    }
  }

  for (let i = 0; i < chunks.length; i += PLANNER_CHUNK_CONCURRENCY) {
    const batch = chunks.slice(i, i + PLANNER_CHUNK_CONCURRENCY);
    const priorUsed = usedPlaces.slice(-35);
    const batchResults = await Promise.all(batch.map((chunk, bi) => runChunk(chunk, priorUsed, i + bi)));
    for (const result of batchResults) {
      chunkResults.push(result);
      for (const d of result.days) {
        for (const it of d.items || []) {
          const t = String(it.title || "").trim();
          if (t) usedPlaces.push(t);
        }
      }
    }
  }

  let allDays = chunkResults.flatMap((r) => r?.days ?? []);
  if (geo?.totalDays) {
    allDays = allDays.map((d) => {
      const dayIndex = geo.tripStartDate ? dayCountBetween(geo.tripStartDate, d.date) : d.day;
      const w = windowForTripDay({
        dayIndex,
        totalDays: geo.totalDays || nights,
        arrivalTime: geo.arrivalTime ?? null,
        departureTime: geo.departureTime ?? null,
      });
      return { ...d, items: clipItemsToDayWindow(d.items || [], w) };
    });
  }
  const allPrompts = chunkResults.map((r, i) => `--- Chunk ${i + 1} ---\n${r?.prompt ?? ""}`).join("\n\n");
  const allRaw = chunkResults.map((r, i) => `--- Chunk ${i + 1} ---\n${r?.rawOutput ?? ""}`).join("\n\n");

  const allowNearby = allowsNearbyExcursions(plannerPrefs);
  const fallbackDays = buildFallbackDaysFromPool(
    city,
    nights,
    startDateIso,
    inCityPool,
    excursionPool,
    allowNearby
  );

  let plannerDays: PlannerDay[] =
    allDays.length > 0
      ? allDays.map((d) => ({
          day: d.day,
          date: d.date,
          base: city,
          items: d.items || [],
        }))
      : fallbackDays;

  plannerDays = dedupeDaysInCityBlock(plannerDays, { notes });

  try {
    plannerDays = await fillSparseDaysInBlock(plannerDays, city, notes, excursionPool, 3, {
      allowNearby,
      inCityPool,
      allowLlmNearby: false,
      minItemsForDate: (date) => {
        const dayIndex = dayCountBetween(geo?.tripStartDate || startDateIso, date);
        const w = windowForTripDay({
          dayIndex,
          totalDays: geo?.totalDays ?? nights,
          arrivalTime: geo?.arrivalTime ?? null,
          departureTime: geo?.departureTime ?? null,
        });
        return w.minSights;
      },
      timesForDate: (date) => {
        const dayIndex = dayCountBetween(geo?.tripStartDate || startDateIso, date);
        const w = windowForTripDay({
          dayIndex,
          totalDays: geo?.totalDays ?? nights,
          arrivalTime: geo?.arrivalTime ?? null,
          departureTime: geo?.departureTime ?? null,
        });
        return slotsAfter(w.earliestMin, FILL_TIMES).filter((time) => itemFitsWindow(time, w));
      },
    });
  } catch (e) {
    logger.error(`[ai-planner] fillSparse failed for "${city}":`, e);
  }

  if (countRealItems(plannerDays) < nights * 2) {
    plannerDays = mergePlannerDaysWithFallback(plannerDays, fallbackDays);
  }
  if (countRealItems(plannerDays) < 1 && countRealItems(fallbackDays) > 0) {
    plannerDays = fallbackDays;
  }

  plannerDays = plannerDays.map((d) => ({
    ...d,
    items: consolidateRestaurantsForDay(d.items || [], {
      prefs: plannerPrefs,
      city,
      date: d.date,
      gastroPool,
    }),
  }));

  const outDays = plannerDays.map((d) => ({
    day: d.day,
    date: d.date,
    base: d.base,
    items: d.items,
    _raw_item_count: d.items.length,
    _filtered_count: 0,
  }));

  if (!forceRegen) itinCacheSet(city, nights, notes, plannerPrefs, outDays);
  return { days: outDays, prompt: allPrompts, rawOutput: allRaw };
}



function buildMultiCategoryQuery(center: LatLng, r: number): string {
  const { lat, lng } = center, a = `(around:${Math.floor(r)},${lat},${lng})`;
  return `[out:json][timeout:8];
(node["tourism"="museum"]${a};way["tourism"="museum"]${a};node["tourism"="attraction"]${a};way["tourism"="attraction"]${a};node["amenity"="theatre"]${a};way["amenity"="theatre"]${a};node["amenity"="arts_centre"]${a};node["historic"="monument"]${a};way["historic"="monument"]${a};node["historic"="castle"]${a};way["historic"="castle"]${a};node["historic"="archaeological_site"]${a};)->.culture;
(node["leisure"="park"]${a};way["leisure"="park"]${a};relation["boundary"="national_park"]${a};node["leisure"="nature_reserve"]${a};way["leisure"="nature_reserve"]${a};node["natural"="peak"]${a};node["natural"="waterfall"]${a};node["natural"="beach"]${a};way["natural"="beach"]${a};node["natural"="bay"]${a};)->.nature;
(node["tourism"="viewpoint"]${a};way["tourism"="viewpoint"]${a};)->.viewpoint;
(node["place"="neighbourhood"]${a};way["place"="neighbourhood"]${a};node["place"="suburb"]${a};way["place"="suburb"]${a};)->.neighborhood;
(node["amenity"="marketplace"]${a};way["amenity"="marketplace"]${a};relation["amenity"="marketplace"]${a};)->.market;
(node["tourism"="wine_cellar"]${a};node["craft"="winery"]${a};node["craft"="brewery"]${a};node["amenity"="cooking_school"]${a};)->.gastro;
(node["shop"="department_store"]${a};way["shop"="department_store"]${a};node["shop"="mall"]${a};way["shop"="mall"]${a};)->.shopping;
(node["amenity"="bar"]${a};way["amenity"="bar"]${a};node["amenity"="pub"]${a};node["amenity"="nightclub"]${a};node["amenity"="cinema"]${a};)->.night;
(.culture;.nature;.viewpoint;.neighborhood;.market;.gastro;.shopping;.night;);
out center tags 600;`;
}

function tagToCategory(tags: Record<string, string>): Category | null {
  const { tourism: t, amenity: a, historic: h, natural: n, leisure: l, place: p, boundary: b, shop: s, craft: c } = tags;
  if (a === "bar" || a === "pub" || a === "nightclub" || a === "cinema") return "night";
  if (t === "museum" || a === "arts_centre" || a === "theatre" || h === "monument" || h === "castle" || h === "archaeological_site") return "culture";
  if (l === "park" || l === "nature_reserve" || b === "national_park" || n === "peak" || n === "waterfall" || n === "beach" || n === "bay") return "nature";
  if (t === "viewpoint") return "viewpoint";
  if (a === "marketplace") return "market";
  if (t === "wine_cellar" || c === "winery" || c === "brewery" || a === "cooking_school") return "gastro_experience";
  if (s === "department_store" || s === "mall") return "shopping";
  if (p === "neighbourhood" || p === "suburb") return "neighborhood";
  if (t === "attraction") return "culture";
  return null;
}

function parseOverpassResponse(payload: unknown, limit: number): Record<Category, Poi[]> {
  const pools = emptyCategoryPools();
  const seen = Object.fromEntries(ALL_CATEGORIES.map((cat) => [cat, new Set<string>()])) as Record<Category, Set<string>>;
  const elements =
    payload && typeof payload === "object" && Array.isArray((payload as { elements?: unknown[] }).elements)
      ? (payload as { elements: unknown[] }).elements
      : [];
  for (const raw of elements) {
    const el = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
    if (!el) continue;
    const tags =
      el.tags && typeof el.tags === "object" ? (el.tags as Record<string, string>) : {};
    const name = typeof tags.name === "string" ? tags.name.trim() : "";
    const center = el.center && typeof el.center === "object" ? (el.center as { lat?: number; lon?: number }) : null;
    const lat = typeof el.lat === "number" ? el.lat : (center?.lat ?? null);
    const lng = typeof el.lon === "number" ? el.lon : (center?.lon ?? null);
    if (!name || lat == null || lng == null) continue;
    const cat = tagToCategory(tags); if (!cat) continue;
    const key = name.toLowerCase(); if (seen[cat].has(key) || pools[cat].length >= limit) continue;
    seen[cat].add(key);
    const tagRecord: Record<string, string> = {};
    for (const [k2, v2] of Object.entries(tags)) if (typeof v2 === "string" && v2.trim()) tagRecord[k2] = v2;
    pools[cat].push({ name, lat, lng, osm: { type: String(el.type || "node"), id: String(el.id || "") }, tags: tagRecord });
  }
  const excSeen = new Set<string>(); pools.excursion = [];
  for (const poi of [...(pools.nature || []), ...(pools.culture || [])]) { const k = poi.name.toLowerCase(); if (excSeen.has(k)) continue; excSeen.add(k); pools.excursion.push(poi); if (pools.excursion.length >= limit) break; }
  return pools;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_ATTEMPT_MS = 8_000;

async function fetchAllPoisFromOverpass(center: LatLng, radiusMeters: number): Promise<Record<Category, Poi[]> | null> {
  const cached = cacheGet(center, radiusMeters); if (cached) return cached;
  const body = `data=${encodeURIComponent(buildMultiCategoryQuery(center, radiusMeters))}`;
  for (const url of OVERPASS_ENDPOINTS) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), OVERPASS_ATTEMPT_MS);
    try {
      const resp = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" }, body, cache: "no-store", signal: ctrl.signal });
      const payload = await resp.json().catch(() => null);
      if (resp.ok && payload) { const pools = parseOverpassResponse(payload, 60); cacheSet(center, radiusMeters, pools); return pools; }
      if (resp.status === 400) break;
    } catch { /* next */ } finally { clearTimeout(t); }
  }
  return null;
}

async function fetchAllPoisFromGemini(stop: { label: string; center: LatLng }): Promise<Record<Category, Poi[]> | null> {
  const prompt = `Devuelve SOLO JSON válido con lugares reales para visitar cerca de ${stop.label}.

Esquema:
{
  "culture": [{"name":"...","lat":0,"lng":0}],
  "nature": [{"name":"...","lat":0,"lng":0}],
  "viewpoint": [{"name":"...","lat":0,"lng":0}],
  "market": [{"name":"...","lat":0,"lng":0}],
  "gastro_experience": [{"name":"...","lat":0,"lng":0}],
  "neighborhood": [{"name":"...","lat":0,"lng":0}]
}

Reglas:
- Lugares reales y turísticos, no genéricos.
- Coordenadas plausibles cerca de ${stop.label}.
- Entre 4 y 10 lugares por categoría si existen.
- No inventes si no estás seguro; mejor menos lugares.`;
  try {
    const raw = await askGemini(prompt, "planning", {
      maxOutputTokens: 3072,
      responseMimeType: "application/json",
    });
    return parseGeminiPoiFallback(raw, 20);
  } catch {
    return null;
  }
}

type PoiLoadResult = { pools: Record<Category, Poi[]>; source: "overpass" | "gemini" } | { pools: null; err: string };

async function loadPoisForStop(
  stop: { label: string; center: LatLng },
  _anchor: { lat: number; lng: number } | null,
  _regionHints: string[],
  _totalDays: number
): Promise<PoiLoadResult> {
  const rough = await fetchAllPoisFromOverpass(stop.center, 12_000);
  if (rough && sumPools(rough) > 0) return { pools: rough, source: "overpass" };
  const gemini = await fetchAllPoisFromGemini(stop);
  if (gemini && sumPools(gemini) > 0) return { pools: gemini, source: "gemini" };
  return { pools: null, err: `No he encontrado lugares suficientes para "${stop.label}". Prueba con una ciudad concreta.` };
}

// ─── Geographic sort — nearest-neighbor greedy within a day ──────────────────
// Reorders items so the route through the day minimises total distance walked.
// Items without coords are appended at the end (they can't be placed on the route).
// Time labels are preserved but reassigned in order so the plan still reads correctly.

function geoDistKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  return R * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2));
}

function sortItemsByProximity(items: PlannerDayItem[]): PlannerDayItem[] {
  if (items.length <= 2) return items;

  // Separate items with and without valid coords
  const withCoords = items.filter((it) => typeof it.latitude === "number" && typeof it.longitude === "number" && it.latitude !== 0);
  const noCoords = items.filter((it) => !(typeof it.latitude === "number" && typeof it.longitude === "number" && it.latitude !== 0));

  if (withCoords.length <= 1) return items;

  // Greedy nearest-neighbor starting from the first item (usually morning)
  const sorted: PlannerDayItem[] = [withCoords[0]!];
  const remaining = withCoords.slice(1);

  while (remaining.length) {
    const last = sorted[sorted.length - 1]!;
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((it, i) => {
      const d = geoDistKm({ lat: last.latitude!, lng: last.longitude! }, { lat: it.latitude!, lng: it.longitude! });
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    sorted.push(remaining.splice(bestIdx, 1)[0]!);
  }

  // Re-assign original time slots in order (so morning/noon/afternoon/night labels stay meaningful)
  const originalTimes = items.map((it) => it.activity_time).filter(Boolean);
  return [...sorted, ...noCoords].map((it, i) => ({
    ...it,
    activity_time: originalTimes[i] ?? it.activity_time,
  }));
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const destinationsRaw: unknown[] = Array.isArray(body?.destinations)
      ? body.destinations
      : Array.isArray(body?.places)
        ? body.places
        : [];
    const destinations = destinationsRaw
      .map((x: unknown) => cleanString(x))
      .filter((x) => x && !isSkippablePlace(x))
      .slice(0, 10);
    const startDate = cleanString(body?.start_date || body?.startDate);
    const endDate = cleanString(body?.end_date || body?.endDate);
    const freeText = cleanString(body?.freeText || "");
    const arrivalTime =
      cleanString(body?.arrivalTime || body?.arrival_time) || parseClockFromNotes(freeText, "llegada") || null;
    const departureTime =
      cleanString(body?.departureTime || body?.departure_time) || parseClockFromNotes(freeText, "salida") || null;
    const brief = normalizePlannerBrief(body?.brief);

    // Merge initial preferences + all chat messages into a single context string
    // This is what feeds Gemini — every chat message the user sends enriches the plan
    const plannerPrefs = parsePlannerPreferences(body);
    const userNotes = mergeNotes(freeText, body?.rules);
    const mergedNotes = enrichNotesWithPlannerPrefs(userNotes, plannerPrefs);

    const selectedByStop = (body?.selectedPoisByStop && typeof body.selectedPoisByStop === "object") ? body.selectedPoisByStop : null;
    const staysInput = Array.isArray(body?.stays) ? body.stays : null;
    const planOnly = Boolean(body?.planOnly);
    const targetDayNums: number[] | null = Array.isArray(body?.targetDayNums)
      ? body.targetDayNums.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n) && n >= 1)
      : null;

    if (!destinations.length) return NextResponse.json({ error: "Faltan destinos." }, { status: 400 });
    if (!isoOk(startDate) || !isoOk(endDate)) return NextResponse.json({ error: "Fechas inválidas." }, { status: 400 });

    const totalDays = dayCountBetween(startDate, endDate);
    if (plannerDaysTooLong(totalDays)) {
      return NextResponse.json({ error: PLANNER_MAX_DAYS_MESSAGE }, { status: 400 });
    }
    const destinationLabel = destinations.join(" · ");
    const anchor = await geocodeTripAnchor(destinationLabel);
    const regionHints = regionHintsFromDestination(destinationLabel);

    // ── 1. Geocode stops ──────────────────────────────────────────────────────
    const stopGeo = await Promise.all(destinations.map(async (label: string) => {
      const g = await geocodePhotonPreferred(label, { anchor, regionHints, maxDistanceKm: 50000 });
      return { label, geo: g };
    }));
    const stops = stopGeo.map((s) => ({ label: s.label, center: s.geo ? ({ lat: s.geo.lat, lng: s.geo.lng } as LatLng) : null, resolvedLabel: s.geo?.label || s.label })).filter((s) => Boolean(s.center)) as Array<{ label: string; resolvedLabel: string; center: LatLng }>;
    if (!stops.length) return NextResponse.json({ error: "No se pudieron geocodificar los destinos." }, { status: 400 });

    // ── 2. Load POI pools (skip on planOnly: el esqueleto no necesita OSM) ───
    const emptyPools = (): Record<Category, Poi[]> => ({
      culture: [], nature: [], viewpoint: [], neighborhood: [],
      market: [], excursion: [], gastro_experience: [], shopping: [], night: [],
    });
    const poisByStop: Record<string, Record<Category, Poi[]>> = {};
    let viability: ReturnType<typeof checkViability> = null;
    if (!planOnly) {
      const stopResults = await Promise.all(stops.map((stop) => loadPoisForStop(stop, anchor, regionHints, totalDays)));
      for (let i = 0; i < stops.length; i++) {
        const result = stopResults[i]!;
        if (!result.pools) {
          logger.warn(`[ai-planner] POIs insuficientes para "${stops[i]!.label}": ${result.err}`);
          poisByStop[stops[i]!.label] = emptyPools();
          continue;
        }
        poisByStop[stops[i]!.label] = result.pools;
      }
      viability = checkViability(stops, totalDays, poisByStop);
    }

    // ── 3. Travel Architect (respeta un esqueleto ya confirmado por el usuario) ─
    let stays: Array<{ stop: string; nights: number; reason?: string }>;
    const parsedStays: Array<{ stop: string; nights: number; reason?: string }> = [];
    if (staysInput?.length) {
      for (const x of staysInput) {
        const row = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
        if (!row) continue;
        const stop = cleanString(row.stop);
        if (!stop || isSkippablePlace(stop)) continue;
        parsedStays.push({
          stop,
          nights: clamp(Number(row.nights) || 1, 1, 60),
          reason: typeof row.reason === "string" ? row.reason : undefined,
        });
      }
    }
    let architecture: TripArchitecture | null = coerceTripArchitecture(body?.architecture, { totalDays, startDate });
    const architectureConfirmed = Boolean(architecture);
    if (!architecture) {
      try {
        architecture = await planTripArchitecture({
          brief,
          notes: mergedNotes,
          stops: stops.map((s) => ({ label: s.label, center: s.center })),
          totalDays,
          startDate,
          endDate,
          arrivalTime,
          departureTime,
          forcedStays: parsedStays.length ? parsedStays : undefined,
        });
      } catch (e) {
        logger.error("[ai-planner] architect failed:", e);
      }
    }
    if (architecture) {
      architecture = remapArchitectureToKnownStops(architecture, stops.map((s) => s.label));
    }

    const requestedBases = (brief?.sleepBases || []).filter(Boolean);
    const omittedBases =
      architecture && requestedBases.length > 1 && totalDays >= requestedBases.length
        ? omittedSleepBases(architecture.days, requestedBases, stops.map((s) => s.label))
        : [];
    const architectStays = omittedBases.length
      ? []
      : (architecture?.stays || []).filter((s) => cleanString(s.stop) && Number(s.nights) > 0);
    if (architectStays.length) {
      stays = architectStays.map((s) => ({ ...s, stop: matchKnownStop(s.stop, stops) }));
    } else if (parsedStays.length) {
      stays = parsedStays.map((s) => ({ ...s, stop: matchKnownStop(s.stop, stops) }));
    } else {
      const startHint =
        cleanString(body?.arrivalPlace || body?.arrival_place || "") ||
        brief?.arrival.place ||
        (mergedNotes.match(/llegada[^.]{0,120}/i)?.[0] ?? "");
      const endHint =
        cleanString(body?.departurePlace || body?.departure_place || "") ||
        brief?.departure.place ||
        (mergedNotes.match(/salida[^.]{0,120}/i)?.[0] ?? "");
      const routed = planStaysToMinimizeDriving(
        stops.map((s) => ({ label: s.label, center: s.center })),
        totalDays,
        { startHint, endHint }
      );
      stays = routed.length
        ? routed
        : distributeNightsSmart(stops, poisByStop, totalDays, mergedNotes);
    }
    if (!architectureConfirmed) {
      stays = repairStaysAvoidingLongHops(
        stays.map((s) => ({ stop: s.stop, nights: s.nights, reason: s.reason || "" })),
        stops.map((s) => ({ label: s.label, center: s.center })),
        totalDays,
        brief?.arrival.place || cleanString(body?.arrivalPlace || body?.arrival_place || "") || stops[0]?.label
      );
    }
    architecture = architectureFromStays({
      stays,
      startDate,
      totalDays,
      arrivalTime,
      departureTime,
      previous: architecture,
    });

    // ── 4. planOnly: esqueleto del viaje, sin itinerario detallado ─────────────
    if (planOnly) {
      return NextResponse.json({
        ok: true,
        planOnly: true,
        totalDays,
        startDate,
        endDate,
        destinations,
        stops: stops.map((s) => ({ key: s.label, label: s.resolvedLabel, center: s.center })),
        stays,
        viability,
        architecture,
        skeletonText: formatTripArchitectureForChat(architecture),
      });
    }

    // ── 6. City-per-day map ───────────────────────────────────────────────────
    const baseByDay: string[] = architecture?.days?.length
      ? architecture.days.map((d) => d.base).filter(Boolean)
      : [];
    if (!baseByDay.length) {
      for (const s of stays) for (let i = 0; i < s.nights; i++) baseByDay.push(s.stop);
    }
    while (baseByDay.length < totalDays) baseByDay.push(stays[stays.length - 1]?.stop || stops[0]!.label);
    baseByDay.splice(totalDays);

    // ── 7. Build city blocks for Gemini ──────────────────────────────────────
    //
    // Each consecutive run of days in the same city = one Gemini call.
    // We pass the full mergedNotes (initial prefs + all chat messages) so every
    // refinement the user makes via chat is reflected in the regenerated plan.

    type CityBlock = { city: string; startDayNum: number; nights: number; startDateIso: string; prevCity: string | null; architectureDays: ArchitectDay[] };
    const blocks: CityBlock[] = [];
    for (const s of stays) {
      const prev = blocks[blocks.length - 1];
      const startDayNum = prev ? prev.startDayNum + prev.nights : 1;
      const architectureDays = (architecture?.days || []).filter((d) => d.dayNum >= startDayNum && d.dayNum < startDayNum + s.nights);
      blocks.push({
        city: s.stop,
        startDayNum,
        nights: s.nights,
        startDateIso: addDaysIso(startDate, startDayNum - 1),
        prevCity: prev?.city ?? null,
        architectureDays,
      });
    }

    // Regenerar si el usuario escribió notas o mandó reglas por chat (no solo prefs por defecto del formulario).
    const forceRegen = Boolean(userNotes.trim());
    const canWholeTrip = !Array.isArray(targetDayNums) || targetDayNums.length === 0;

    let wholeTripDays: PlannerDay[] | null = null;
    if (canWholeTrip && architecture?.days?.length) {
      try {
        const generated = await generateWholeTripItinerary({
          brief,
          notes: mergedNotes,
          stops: stops.map((s) => ({ label: s.label, center: s.center })),
          architecture,
          totalDays,
          startDate,
          endDate,
          arrivalTime,
          departureTime,
        });
        if (generated.some((d) => (d.items || []).length > 0)) wholeTripDays = generated;
      } catch (e) {
        logger.error("[ai-planner] whole-trip itinerary failed:", e);
      }
    }

    // Generate city blocks only if the whole-trip pass produced nothing.
    const blockResults = wholeTripDays
      ? blocks.map(() => ({ days: [] as PlannerDayWithMeta[], prompt: "(whole-trip itinerary)", rawOutput: "" }))
      : await Promise.all(
      blocks.map((block) => {
        // If targetDayNums restricts which days to regen, skip blocks not affected
        if (Array.isArray(targetDayNums) && targetDayNums.length > 0) {
          const blockDays = Array.from({ length: block.nights }, (_, i) => block.startDayNum + i);
          if (!blockDays.some((d) => targetDayNums.includes(d))) return Promise.resolve(null);
        }
        const stopPools = resolveStopPools(poisByStop, block.city);
        const excursionPool = poisToNearbyPool(stopPools);
        const inCityPool = poisToInCityPool(stopPools);
        const gastroPool = poisToGastroPool(stopPools);
        const cityStop = stops.find((s) => s.label.toLowerCase() === block.city.toLowerCase()) || stops.find((s) => {
          const a = s.label.toLowerCase();
          const b = block.city.toLowerCase();
          return a.startsWith(b) || b.startsWith(a);
        });
        const prevStop = block.prevCity
          ? stops.find((s) => s.label.toLowerCase() === block.prevCity!.toLowerCase())
          : null;
        const otherStops = stops
          .filter((s) => s.label.toLowerCase() !== (cityStop?.label || block.city).toLowerCase())
          .map((s) => ({ label: s.label, center: s.center }));
        return generateCityItinerary(
          block.city,
          block.nights,
          block.startDateIso,
          mergedNotes,
          block.prevCity,
          forceRegen,
          excursionPool,
          inCityPool,
          gastroPool,
          plannerPrefs,
          {
            otherBases: stays
              .map((s) => s.stop)
              .filter(
                (stop) =>
                  stop.toLowerCase() !== block.city.toLowerCase() &&
                  stop.toLowerCase() !== (block.prevCity || "").toLowerCase()
              ),
            cityCenter: cityStop?.center ?? null,
            prevCenter: prevStop?.center ?? null,
            otherStops,
            tripStartDate: startDate,
            tripEndDate: endDate,
            totalDays,
            arrivalTime,
            departureTime,
          },
          block.architectureDays
        );
      })
    );

    // Collect debug info (prompts + raw outputs per city block)
    const _debugBlocks = blocks.map((block, bi) => ({
      city: block.city,
      nights: block.nights,
      startDate: block.startDateIso,
      prompt: blockResults[bi]?.prompt ?? null,
      rawOutput: blockResults[bi]?.rawOutput ?? null,
      itemsGenerated: (blockResults[bi]?.days ?? []).reduce((n, d) => n + (d._raw_item_count || d.items?.length || 0), 0),
      itemsFiltered: (blockResults[bi]?.days ?? []).reduce((n, d) => n + (d._filtered_count || 0), 0),
      emptyDays: (blockResults[bi]?.days ?? []).filter((d) => !d.items?.length).length,
    }));

    const blockResultsFinal = blockResults.map((result) => result?.days ?? null);

    // Existing days map (for partial regeneration)
    const existingDaysMap = new Map<number, PlannerDay>();
    if (Array.isArray(body?.days)) {
      for (const raw of body.days) {
        const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
        if (!d || typeof d.day !== "number") continue;
        existingDaysMap.set(d.day, {
          day: d.day,
          date: typeof d.date === "string" ? d.date : "",
          base: typeof d.base === "string" ? d.base : undefined,
          items: Array.isArray(d.items) ? (d.items as PlannerDayItem[]) : [],
        });
      }
    }

    // ── 8. Merge blocks into flat days array ──────────────────────────────────
    const daysOut: PlannerDay[] = [];
    const usedTitles = new Set<string>();

    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi]!;
      const generatedDays = blockResultsFinal[bi];
      const cityPool = [
        ...poisToInCityPool(resolveStopPools(poisByStop, block.city)),
        ...poisToNearbyPool(resolveStopPools(poisByStop, block.city)),
      ];
      const prevPool = block.prevCity
        ? [
            ...poisToNearbyPool(resolveStopPools(poisByStop, block.prevCity)),
            ...poisToInCityPool(resolveStopPools(poisByStop, block.prevCity)),
          ]
        : [];

      const cityStop = stops.find((s) => s.label.toLowerCase() === block.city.toLowerCase());
      const prevStop = block.prevCity
        ? stops.find((s) => s.label.toLowerCase() === block.prevCity!.toLowerCase())
        : null;
      const driveKm =
        cityStop && prevStop ? haversineKm(prevStop.center, cityStop.center) : 180;
      const driveHours =
        cityStop && prevStop ? roundedDriveHours(prevStop.center, cityStop.center) : Math.max(1, Math.round(driveKm / 55));

      for (let di = 0; di < block.nights; di++) {
        const globalDayNum = block.startDayNum + di;
        const dayDate = addDaysIso(startDate, globalDayNum - 1);
        const architectureDay = block.architectureDays[di] ?? null;
        const isTransfer = di === 0 && Boolean(block.prevCity);
        const dayWindow = windowForTripDay({ dayIndex: globalDayNum, totalDays, arrivalTime, departureTime });
        const architectMinSights =
          architectureDay?.dayType === "arrival"
            ? 0
            : architectureDay?.dayType === "departure"
              ? Math.min(1, dayWindow.maxSights)
              : architectureDay?.dayType === "transfer_practical"
                ? Math.min(2, dayWindow.maxSights)
                : architectureDay?.dayType === "transfer_scenic"
                  ? Math.min(Math.max(2, architectureDay.mainActivities.length || 2), dayWindow.maxSights)
                  : architectureDay?.availableHours != null
                    ? architectureDay.availableHours >= 8
                      ? 3
                      : architectureDay.availableHours >= 5
                        ? 2
                        : 1
                    : dayWindow.minSights;
        const minSights = isTransfer ? minSightsForDriveHours(driveHours) : architectMinSights;

        const gemDay = wholeTripDays?.find((d) => d.day === globalDayNum) ?? generatedDays?.[di];
        const hasContent = gemDay && Array.isArray(gemDay.items) && gemDay.items.length > 0;

        let items: PlannerDayItem[] = [];
        if (hasContent) {
          items = (gemDay.items || []).map((it) => ({ ...it, activity_date: dayDate }));
        } else if (existingDaysMap.has(globalDayNum)) {
          const existing = existingDaysMap.get(globalDayNum)!;
          items = Array.isArray(existing.items) ? existing.items.map((it) => ({ ...it, activity_date: dayDate })) : [];
        }
        const seeded = seedFromArchitecture(architectureDay, block.city, dayDate, FILL_TIMES, cityStop?.center ?? null);
        if (seeded.length) {
          const seen = new Set(items.map((it) => String(it.title || "").toLowerCase()));
          items = [...seeded.filter((it) => !seen.has(String(it.title || "").toLowerCase())), ...items];
        }
        if (isTransfer && prevStop && cityStop) {
          items = items.filter((it) => {
            const kind = String(it.activity_kind || "").toLowerCase();
            if (kind === "transport" || kind === "rest") return true;
            if (typeof it.latitude !== "number" || typeof it.longitude !== "number") return true;
            return shouldKeepPoiOnTransferDay(
              { lat: it.latitude, lng: it.longitude },
              cityStop.center,
              prevStop.center,
              stops.map((s) => ({ label: s.label, center: s.center })),
              block.prevCity
            );
          });
        }

        if (isTransfer) {
          const alreadyHasTransit = items.some((it) => String(it.activity_kind || "").toLowerCase() === "transport");
          if (!alreadyHasTransit) {
            items = [
              {
                title: `Traslado ${block.prevCity} → ${block.city}`,
                description:
                  driveHours <= 3
                    ? `Unas ${driveHours} h de trayecto: cabe una parada en ruta y algo a la llegada.`
                    : `Traslado de unas ${driveHours} h. No es un día completo en destino: solo paradas sobre la ruta.`,
                activity_date: dayDate,
                activity_time: "08:30",
                place_name: `${block.prevCity} → ${block.city}`,
                address: `${block.prevCity} → ${block.city}`,
                latitude: null,
                longitude: null,
                activity_kind: "transport",
                activity_type: "general",
                source: "ai_planner",
              },
              ...items,
            ];
          }
        } else if (items.length) {
          items = sortItemsByProximity(items);
        }
        items = clipItemsToDayWindow(items, dayWindow);

        const fillPool = isTransfer || architectureDay?.dayType === "transfer_scenic" || architectureDay?.dayType === "transfer_practical"
          ? [...prevPool, ...cityPool]
          : cityPool;
        const fillTimes = slotsAfter(dayWindow.earliestMin, isTransfer ? TRANSFER_FILL_TIMES : FILL_TIMES).filter((time) =>
          itemFitsWindow(time, dayWindow)
        );
        items = fillDayFromPools(
          items,
          dayDate,
          block.city,
          fillPool,
          usedTitles,
          minSights,
          fillTimes,
          cityStop?.center ?? null
        );
        if (isTransfer) {
          items = scheduleAlongTransfer(
            items,
            prevStop?.center ?? null,
            cityStop?.center ?? null,
            driveHours,
            "08:30",
            dayWindow.latestMin
          );
        }
        if (
          (architectureDay?.dayType === "arrival" || (globalDayNum === 1 && dayWindow.maxSights === 0)) &&
          !items.some((it) => String(it.activity_kind || "").toLowerCase() === "rest")
        ) {
          items = [arrivalRestItem(block.city, dayDate, arrivalTime), ...items];
        }

        const stopPools = resolveStopPools(poisByStop, block.city);
        items = consolidateRestaurantsForDay(items, {
          prefs: plannerPrefs,
          city: block.city,
          date: dayDate,
          gastroPool: poisToGastroPool(stopPools),
        });
        for (const it of items) {
          const t = String(it.title || "").trim().toLowerCase();
          if (t && String(it.activity_kind || "").toLowerCase() !== "transport") usedTitles.add(t);
        }
        daysOut.push({ day: globalDayNum, date: dayDate, base: block.city, items });
      }
    }

    const dedupedDaysOut = dedupeDaysAcrossTrip(daysOut, { notes: mergedNotes });
    const repairedDaysOut: PlannerDay[] = [];
    const usedAfterRepair = new Set<string>();

    for (let i = 0; i < dedupedDaysOut.length; i++) {
      const day = dedupedDaysOut[i]!;
      const architectureDay = architecture?.days?.find((d) => d.dayNum === day.day) ?? null;
      const prevDay = repairedDaysOut[i - 1] ?? null;
      const prevBase = prevDay?.base || null;
      const isTransfer = Boolean(prevBase && prevBase !== day.base);
      const cityStop = stops.find((s) => s.label.toLowerCase() === String(day.base || "").toLowerCase()) || null;
      const prevStop = prevBase
        ? stops.find((s) => s.label.toLowerCase() === prevBase.toLowerCase()) || null
        : null;
      const driveKm = cityStop && prevStop ? haversineKm(prevStop.center, cityStop.center) : 180;
      const driveHours =
        cityStop && prevStop ? roundedDriveHours(prevStop.center, cityStop.center) : Math.max(1, Math.round(driveKm / 55));
      const dayWindow = windowForTripDay({ dayIndex: day.day, totalDays, arrivalTime, departureTime });
      const architectMinSights =
        architectureDay?.dayType === "arrival"
          ? 0
          : architectureDay?.dayType === "departure"
            ? Math.min(1, dayWindow.maxSights)
            : architectureDay?.dayType === "transfer_practical"
              ? Math.min(2, dayWindow.maxSights)
              : architectureDay?.dayType === "transfer_scenic"
                ? Math.min(Math.max(2, architectureDay.mainActivities.length || 2), dayWindow.maxSights)
                : architectureDay?.availableHours != null
                  ? architectureDay.availableHours >= 8
                    ? 3
                    : architectureDay.availableHours >= 5
                      ? 2
                      : 1
                  : dayWindow.minSights;
      const minSights = isTransfer ? minSightsForDriveHours(driveHours) : architectMinSights;
      const fillPool = isTransfer || architectureDay?.dayType === "transfer_scenic" || architectureDay?.dayType === "transfer_practical"
        ? [
            ...poisToNearbyPool(resolveStopPools(poisByStop, prevBase || "")),
            ...poisToInCityPool(resolveStopPools(poisByStop, prevBase || "")),
            ...poisToInCityPool(resolveStopPools(poisByStop, day.base || "")),
            ...poisToNearbyPool(resolveStopPools(poisByStop, day.base || "")),
          ]
        : [
            ...poisToInCityPool(resolveStopPools(poisByStop, day.base || "")),
            ...poisToNearbyPool(resolveStopPools(poisByStop, day.base || "")),
          ];
      const fillTimes = slotsAfter(dayWindow.earliestMin, isTransfer ? TRANSFER_FILL_TIMES : FILL_TIMES).filter((time) =>
        itemFitsWindow(time, dayWindow)
      );
      let items = clipItemsToDayWindow(day.items || [], dayWindow);
      items = fillDayFromPools(
        items,
        day.date,
        day.base || "",
        fillPool,
        usedAfterRepair,
        minSights,
        fillTimes,
        cityStop?.center ?? null
      );
      if (isTransfer) {
        items = scheduleAlongTransfer(
          items,
          prevStop?.center ?? null,
          cityStop?.center ?? null,
          driveHours,
          "08:30",
          dayWindow.latestMin
        );
      }
      if (
        (architectureDay?.dayType === "arrival" || (day.day === 1 && dayWindow.maxSights === 0)) &&
        !items.some((it) => String(it.activity_kind || "").toLowerCase() === "rest")
      ) {
        items = [arrivalRestItem(day.base || "", day.date, arrivalTime), ...items];
      }
      for (const it of items) {
        const t = String(it.title || "").trim().toLowerCase();
        if (t && String(it.activity_kind || "").toLowerCase() !== "transport") usedAfterRepair.add(t);
      }
      repairedDaysOut.push({ ...day, items });
    }

    while (repairedDaysOut.length < totalDays) {
      repairedDaysOut.push({ day: repairedDaysOut.length + 1, date: addDaysIso(startDate, repairedDaysOut.length), base: stays[stays.length - 1]?.stop || stops[0]!.label, items: [] });
    }

    for (let i = 0; i < repairedDaysOut.length; i++) {
      const day = repairedDaysOut[i]!;
      const real = (day.items || []).filter((it) => String(it.activity_kind || "").toLowerCase() !== "transport").length;
      if (real > 0) continue;
      const dayWindow = windowForTripDay({ dayIndex: day.day, totalDays, arrivalTime, departureTime });
      const cityStop = stops.find((s) => s.label.toLowerCase() === String(day.base || "").toLowerCase()) || null;
      if (dayWindow.maxSights <= 0) {
        repairedDaysOut[i] = {
          ...day,
          items: [arrivalRestItem(day.base || cityStop?.label || "destino", day.date, arrivalTime)],
        };
        continue;
      }
      repairedDaysOut[i] = {
        ...day,
        items: fillDayFromPools(
          day.items || [],
          day.date,
          day.base || cityStop?.label || "destino",
          syntheticCityPool(day.base || cityStop?.label || "destino", cityStop?.center ?? null),
          new Set(),
          Math.max(1, dayWindow.minSights || 1),
          slotsAfter(dayWindow.earliestMin, FILL_TIMES),
          cityStop?.center ?? null
        ),
      };
    }

    const driving = brief?.transport === "driving" || /\bcoche\b/i.test(mergedNotes);
    const wineLimited = capWineries(repairedDaysOut, driving ? 2 : 4);
    repairedDaysOut.splice(0, repairedDaysOut.length, ...wineLimited);
    const lastDay = repairedDaysOut[repairedDaysOut.length - 1];
    if (lastDay && departureTime) {
      const w = windowForTripDay({ dayIndex: lastDay.day, totalDays, arrivalTime, departureTime });
      lastDay.items = clipItemsToDayWindow(lastDay.items || [], w);
      if (!(lastDay.items || []).some((it) => /margen al aeropuerto|devolver el coche/i.test(String(it.title || "")))) {
        lastDay.items = [...(lastDay.items || []), airportBufferItem(lastDay.base || "", lastDay.date, departureTime)];
      }
    }

    const activityCount = repairedDaysOut.reduce(
      (n, d) =>
        n + (d.items || []).filter((it: { activity_kind?: string }) => String(it.activity_kind || "").toLowerCase() !== "transport").length,
      0
    );

    const suggestions: Record<string, Array<{ category: Category; pois: Poi[] }>> = {};
    for (const stop of stops) {
      const p = poisByStop[stop.label];
      suggestions[stop.label] = [
        { category: "culture", pois: pickN(p?.culture || [], 18) },
        { category: "nature", pois: pickN(p?.nature || [], 18) },
        { category: "market", pois: pickN(p?.market || [], 12) },
        { category: "viewpoint", pois: pickN(p?.viewpoint || [], 12) },
        { category: "neighborhood", pois: pickN(p?.neighborhood || [], 12) },
        { category: "gastro_experience", pois: pickN(p?.gastro_experience || [], 12) },
      ];
    }

    return NextResponse.json({
      ok: true, totalDays, startDate, endDate, destinations,
      stops: stops.map((s) => ({ key: s.label, label: s.resolvedLabel, center: s.center })),
      stays, baseCityByDay: baseByDay, suggestions, days: repairedDaysOut, viability, architecture,
      _debug: {
        mergedNotes,
        blocks: _debugBlocks,
        activityCount,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo generar el borrador.";
    logger.error("[ai-planner] POST failed:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
