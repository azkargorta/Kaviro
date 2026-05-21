import { geocodePhotonPreferred, geocodeTripAnchor, regionHintsFromDestination } from "@/lib/geocoding/photonGeocode";
import { askGemini } from "@/lib/trip-ai/providers";

export type AccommodationBasePlace = { name: string; lat: number; lng: number };

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function repairJsonSlice(slice: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("jsonrepair") as { jsonrepair?: (input: string) => string } | ((input: string) => string);
    const fn = typeof mod === "function" ? mod : mod?.jsonrepair;
    if (typeof fn === "function") return fn(slice);
  } catch {
    /* ignore */
  }
  return slice;
}

function extractArrayPayload(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    for (const key of ["places", "cities", "towns", "bases", "destinations", "items"]) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return [];
}

function parsePlacesArray(raw: string): Array<{ name: string; lat: number | null; lng: number | null }> {
  const text = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const startArr = text.indexOf("[");
  const endArr = text.lastIndexOf("]");
  let parsed: unknown = null;

  if (startArr >= 0 && endArr > startArr) {
    const slice = text.slice(startArr, endArr + 1);
    try {
      parsed = JSON.parse(slice);
    } catch {
      try {
        parsed = JSON.parse(repairJsonSlice(slice));
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    const startObj = text.indexOf("{");
    const endObj = text.lastIndexOf("}");
    if (startObj >= 0 && endObj > startObj) {
      const slice = text.slice(startObj, endObj + 1);
      try {
        parsed = JSON.parse(slice);
      } catch {
        try {
          parsed = JSON.parse(repairJsonSlice(slice));
        } catch {
          parsed = null;
        }
      }
    }
  }

  const arr = extractArrayPayload(parsed);
  const out: Array<{ name: string; lat: number | null; lng: number | null }> = [];
  const seen = new Set<string>();

  for (const item of arr) {
    const row = item as Record<string, unknown>;
    const name = String(row?.name || row?.city || row?.town || row?.label || "").trim();
    const lat = num(row?.lat ?? row?.latitude);
    const lng = num(row?.lng ?? row?.longitude ?? row?.lon);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, lat, lng });
  }
  return out;
}

async function enrichWithGeocoding(
  region: string,
  rows: Array<{ name: string; lat: number | null; lng: number | null }>
): Promise<AccommodationBasePlace[]> {
  const anchor = await geocodeTripAnchor(region);
  const regionHints = regionHintsFromDestination(region);
  const out: AccommodationBasePlace[] = [];

  for (const row of rows) {
    let lat = row.lat;
    let lng = row.lng;
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      const q = `${row.name}, ${region}`;
      const hit = await geocodePhotonPreferred(q, {
        anchor,
        regionHints,
        maxDistanceKm: 400,
      }).catch(() => null);
      if (hit) {
        lat = hit.lat;
        lng = hit.lng;
      }
    }
    if (lat === null || lng === null) continue;
    out.push({ name: row.name, lat, lng });
  }
  return out;
}

/**
 * Pide a la IA ciudades/pueblos turísticos donde alojarse dentro de un destino amplio.
 */
export async function suggestAccommodationBasesWithAi(
  regionQuery: string,
  limit: number,
  exclude: string[] = []
): Promise<AccommodationBasePlace[]> {
  const region = regionQuery.trim();
  if (!region) return [];

  const excludeClean = exclude.map((n) => n.trim()).filter(Boolean);
  const excludeLine =
    excludeClean.length > 0
      ? `\nNO repitas estos lugares (ya sugeridos o elegidos): ${excludeClean.join(", ")}.`
      : "";

  const want = Math.min(Math.max(limit, 8), 20);

  const prompt = `Destino amplio del viaje: "${region}" (país, comunidad autónoma, provincia, costa, isla…).

Lista ${want} CIUDADES o PUEBLOS REALES dentro de "${region}" donde los turistas suelen ALOJARSE (hoteles, hostales, apartamentos) y usar como base para visitar la zona.
${excludeLine}

Prioriza los más turísticos y conocidos. Solo municipios con oferta real de alojamiento.

Responde ÚNICAMENTE con un JSON array (sin markdown), cada elemento:
{"name":"Nombre del municipio","lat":43.36,"lng":-5.85}

Reglas:
- Solo localidades reales dentro de "${region}". Nunca "${region}" solo si es una región.
- lat/lng: centro del municipio, números (pueden ser decimales).
- Orden: de más a menos recomendado como base turística.`;

  const raw = await askGemini(prompt, "planning", {
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  });

  let rows = parsePlacesArray(raw);
  if (rows.length < 3) {
    const retryRaw = await askGemini(
      `Lista ${want} ciudades o pueblos turísticos para dormir en un viaje a ${region}, España o el país que corresponda. JSON array: [{"name":"...","lat":0,"lng":0}]. Solo nombres reales.`,
      "planning",
      { maxOutputTokens: 1536, responseMimeType: "application/json" }
    );
    rows = parsePlacesArray(retryRaw);
  }

  let places = await enrichWithGeocoding(region, rows);
  const excludeSet = new Set(excludeClean.map((n) => n.toLowerCase()));
  places = places.filter((p) => !excludeSet.has(p.name.toLowerCase())).slice(0, limit);

  if (places.length === 0) {
    throw new Error(
      "La IA no devolvió ciudades válidas para esta zona. Pulsa «Reintentar» o escribe directamente una ciudad (ej. Oviedo, Gijón)."
    );
  }

  return places;
}
