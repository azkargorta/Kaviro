import { askGemini } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";

/** Normaliza título/lugar para comparar duplicados entre días. */
export function normalizeActivityKey(title: string, placeName?: string): string {
  const raw = `${String(title || "").trim()}|${String(placeName || title || "").trim()}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return raw
    .replace(/^(visita|tour|paseo|excursi[oó]n|explorar|descubrir|d[ií]a en)\s+(a\s+|al\s+|la\s+|el\s+|por\s+)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoreName(title: string): string {
  const key = normalizeActivityKey(title);
  const pipe = key.indexOf("|");
  return pipe >= 0 ? key.slice(0, pipe).trim() : key;
}

export function activitiesLikelySame(a: string, b: string): boolean {
  const ka = extractCoreName(a);
  const kb = extractCoreName(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.length >= 6 && kb.length >= 6 && (ka.includes(kb) || kb.includes(ka))) return true;
  return false;
}

/** Lugares que suelen necesitar más de un día (parques temáticos, parques nacionales grandes, etc.). */
const MULTI_DAY_VENUE_RE =
  /\b(disney|disneyland|universal\s+studios|warner\b|portaventura|parque\s+tem[aá]tico|theme\s*park|legoland|europa\s*park|parque\s+nacional|national\s+park|yosemite|yellowstone|grand\s+canyon|serengeti|kilimanjaro|machu\s+picchu|angkor|petra\b|louvre\b.*\b(d[ií]a|dias|days)\b|museo\s+del\s+prado\b.*\b(d[ií]a|dias)\b)/iu;

export function isMultiDayVenue(title: string, placeName?: string): boolean {
  const text = `${title} ${placeName || ""}`;
  return MULTI_DAY_VENUE_RE.test(text);
}

/** El viajero pidió explícitamente repetir o dedicar varios días a un lugar. */
export function notesAllowMultiDayFor(title: string, notes: string): boolean {
  const n = notes.toLowerCase();
  if (!n.trim()) return false;
  const core = extractCoreName(title);
  if (!core || core.length < 4) return false;
  const multiDayHints =
    /\b(2\s*d[ií]as|dos\s+d[ií]as|varios\s+d[ií]as|m[aá]s\s+de\s+un\s+d[ií]a|dedicar\s+.*\s+d[ií]a|repetir|volver\s+a|otra\s+vez|segundo\s+d[ií]a)\b/iu;
  if (!multiDayHints.test(n)) return false;
  const words = core.split(/\s+/).filter((w) => w.length >= 4);
  return words.some((w) => n.includes(w));
}

export type PlannerDayItem = {
  title: string;
  place_name?: string;
  description?: string | null;
  activity_date?: string;
  activity_time?: string | null;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  activity_kind?: string;
  activity_type?: string;
  source?: string;
};

export type PlannerDay = {
  day: number;
  date: string;
  base?: string;
  items: PlannerDayItem[];
};

export type DedupeOptions = {
  notes: string;
  /** Máximo de apariciones del mismo lugar en el bloque (salvo excepciones). */
  maxRepeats?: number;
};

/**
 * Elimina actividades repetidas entre días del mismo bloque/ciudad.
 * Permite repetir solo si el usuario lo pidió en notas o es un venue multi-día conocido.
 */
export function dedupeDaysInCityBlock(days: PlannerDay[], opts: DedupeOptions): PlannerDay[] {
  const notes = opts.notes || "";
  const maxRepeats = opts.maxRepeats ?? 1;
  const priorTitles: string[] = [];

  return days.map((day) => {
    const items: PlannerDayItem[] = [];
    for (const it of day.items || []) {
      const kind = String(it.activity_kind || "").toLowerCase();
      if (kind === "transport") {
        items.push(it);
        continue;
      }
      const title = String(it.title || "").trim();
      if (!title) continue;

      const similarCount = priorTitles.filter((prev) => activitiesLikelySame(title, prev)).length;
      const allowMulti =
        isMultiDayVenue(title, it.place_name) &&
        (notesAllowMultiDayFor(title, notes) || similarCount < 2);
      const allowExplicit = notesAllowMultiDayFor(title, notes);

      if (similarCount >= maxRepeats && !allowMulti && !allowExplicit) continue;

      priorTitles.push(title);
      items.push(it);
    }
    return { ...day, items };
  });
}

export type NearbyPoi = { name: string; lat: number; lng: number };

function parseNearbyList(raw: string): NearbyPoi[] {
  const parsed = extractJsonObject(raw) as { places?: unknown[]; towns?: unknown[] } | unknown[] | null;
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { places?: unknown[] })?.places)
      ? (parsed as { places: unknown[] }).places
      : Array.isArray((parsed as { towns?: unknown[] })?.towns)
        ? (parsed as { towns: unknown[] }).towns
        : [];
  const out: NearbyPoi[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const row = item as Record<string, unknown>;
    const name = String(row?.name || row?.town || "").trim();
    const lat = typeof row?.lat === "number" ? row.lat : Number(row?.lat);
    const lng = typeof row?.lng === "number" ? row.lng : Number(row?.lng ?? row?.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, lat, lng });
  }
  return out;
}

/** Pueblos o lugares cercanos para excursión de un día cuando la ciudad base está agotada. */
export async function suggestNearbyDayTrips(
  baseCity: string,
  exclude: string[],
  notes: string,
  limit = 8
): Promise<NearbyPoi[]> {
  const excludeLine = exclude.length ? `\nNO repitas: ${exclude.slice(0, 40).join(", ")}.` : "";
  const profile = notes.trim() ? `\nPreferencias: ${notes.slice(0, 400)}` : "";
  const prompt = `Ciudad base del viajero: "${baseCity}".
${profile}${excludeLine}

Lista ${limit} PUEBLOS, COSTAS o LUGARES CERCANOS (excursión de 1 día desde ${baseCity}) con alojamiento turístico o atractivos visitables.
Distancia razonable en coche/tren (< 120 km si es posible). Solo nombres reales.

JSON array: [{"name":"...","lat":0.0,"lng":0.0}]`;

  try {
    const raw = await askGemini(prompt, "planning", {
      maxOutputTokens: 1536,
      responseMimeType: "application/json",
    });
    return parseNearbyList(raw).slice(0, limit);
  } catch {
    return [];
  }
}

export function buildExcursionItem(
  poi: NearbyPoi,
  baseCity: string,
  date: string,
  time: string
): PlannerDayItem {
  return {
    title: `Excursión a ${poi.name}`,
    description: `Día en ${poi.name}, cerca de ${baseCity}.`,
    activity_date: date,
    activity_time: time,
    place_name: poi.name,
    address: `${poi.name}, cerca de ${baseCity}`,
    latitude: poi.lat,
    longitude: poi.lng,
    activity_kind: "excursion",
    activity_type: "visit",
    source: "ai_planner_nearby",
  };
}

const DEFAULT_TIMES = ["09:30", "12:00", "16:30", "19:00"];

/** Rellena días con pocas actividades usando POIs de excursión o pueblos cercanos. */
export function buildInCityItem(poi: NearbyPoi, baseCity: string, date: string, time: string, kind = "culture"): PlannerDayItem {
  return {
    title: poi.name,
    description: `En ${baseCity}.`,
    activity_date: date,
    activity_time: time,
    place_name: poi.name,
    address: `${poi.name}, ${baseCity}`,
    latitude: poi.lat,
    longitude: poi.lng,
    activity_kind: kind,
    activity_type: "visit",
    source: "ai_planner_fill",
  };
}

export async function fillSparseDaysInBlock(
  days: PlannerDay[],
  baseCity: string,
  notes: string,
  excursionPool: NearbyPoi[],
  minItems = 3,
  opts?: { allowNearby?: boolean; inCityPool?: NearbyPoi[] }
): Promise<PlannerDay[]> {
  const allowNearby = opts?.allowNearby !== false;
  const inCityPool = opts?.inCityPool ?? [];
  const usedTitles: string[] = [];
  for (const d of days) {
    for (const it of d.items || []) {
      if (String(it.activity_kind || "").toLowerCase() !== "transport") {
        usedTitles.push(String(it.title || ""));
      }
    }
  }

  let nearbyCache: NearbyPoi[] | null = null;

  const out: PlannerDay[] = [];
  for (const day of days) {
    const items = [...(day.items || [])];
    const realCount = items.filter((it) => String(it.activity_kind || "").toLowerCase() !== "transport").length;
    if (realCount >= minItems) {
      out.push(day);
      continue;
    }

    const need = minItems - realCount;
    const added: PlannerDayItem[] = [];

    for (const poi of inCityPool) {
      if (added.length >= need) break;
      if (usedTitles.some((t) => activitiesLikelySame(t, poi.name))) continue;
      const time = DEFAULT_TIMES[(items.length + added.length) % DEFAULT_TIMES.length]!;
      added.push(buildInCityItem(poi, baseCity, day.date, time));
      usedTitles.push(poi.name);
    }

    if (allowNearby) {
      for (const poi of excursionPool) {
        if (added.length >= need) break;
        if (usedTitles.some((t) => activitiesLikelySame(t, poi.name))) continue;
        const time = DEFAULT_TIMES[(items.length + added.length) % DEFAULT_TIMES.length]!;
        added.push(buildExcursionItem(poi, baseCity, day.date, time));
        usedTitles.push(poi.name);
      }

      if (added.length < need) {
        if (!nearbyCache) {
          nearbyCache = await suggestNearbyDayTrips(baseCity, usedTitles, notes, 10);
        }
        for (const poi of nearbyCache) {
          if (added.length >= need) break;
          if (usedTitles.some((t) => activitiesLikelySame(t, poi.name))) continue;
          const time = DEFAULT_TIMES[(items.length + added.length) % DEFAULT_TIMES.length]!;
          added.push(buildExcursionItem(poi, baseCity, day.date, time));
          usedTitles.push(poi.name);
        }
      }
    }

    out.push({ ...day, items: [...items, ...added] });
  }
  return out;
}
