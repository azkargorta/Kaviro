import { NextResponse } from "next/server";
import { isLatLng } from "@/lib/geo/lat-lng";
import { type OverpassElement, parseOverpassElements } from "@/lib/osm/overpass-types";

export const runtime = "nodejs";
export const maxDuration = 30;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type PoiCategoryKey =
  | "culture"
  | "nature"
  | "viewpoint"
  | "neighborhood"
  | "market"
  | "excursion"
  | "gastro_experience"
  | "shopping"
  | "night";

function elementLatLng(el: OverpassElement): { lat: number; lng: number } | null {
  const lat = typeof el.lat === "number" ? el.lat : typeof el.center?.lat === "number" ? el.center.lat : null;
  const lng = typeof el.lon === "number" ? el.lon : typeof el.center?.lon === "number" ? el.center.lon : null;
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function nameFromTags(tags: Record<string, unknown>): string {
  const raw = typeof tags?.name === "string" ? tags.name : "";
  return String(raw || "").trim();
}

function buildCategoryBlocks(category: PoiCategoryKey, radiusMeters: number, lat: number, lng: number): string[] {
  const around = `(around:${Math.floor(radiusMeters)},${lat},${lng})`;
  const tagAround = (k: string, v: string) => [
    `node["${k}"="${v}"]${around};`,
    `way["${k}"="${v}"]${around};`,
    `relation["${k}"="${v}"]${around};`,
  ];

  // Nota: Overpass es público; preferimos queries moderadas y luego filtramos.
  if (category === "culture") {
    return [
      ...tagAround("tourism", "museum"),
      ...tagAround("tourism", "attraction"),
      ...tagAround("amenity", "theatre"),
      ...tagAround("amenity", "arts_centre"),
      ...tagAround("historic", "monument"),
      ...tagAround("historic", "castle"),
      ...tagAround("historic", "archaeological_site"),
    ];
  }
  if (category === "nature") {
    return [
      ...tagAround("leisure", "park"),
      ...tagAround("boundary", "national_park"),
      ...tagAround("leisure", "nature_reserve"),
      ...tagAround("natural", "peak"),
      ...tagAround("natural", "waterfall"),
      ...tagAround("natural", "beach"),
      ...tagAround("natural", "bay"),
    ];
  }
  if (category === "viewpoint") {
    return [...tagAround("tourism", "viewpoint")];
  }
  if (category === "market") {
    return [
      ...tagAround("amenity", "marketplace"),
      ...tagAround("shop", "mall"),
      ...tagAround("shop", "supermarket"),
    ];
  }
  if (category === "shopping") {
    // Solo un muestreo (si se trae demasiado, es ruido).
    return [
      ...tagAround("shop", "department_store"),
      ...tagAround("shop", "mall"),
      ...tagAround("tourism", "gift_shop"),
    ];
  }
  if (category === "night") {
    return [
      ...tagAround("amenity", "bar"),
      ...tagAround("amenity", "pub"),
      ...tagAround("amenity", "nightclub"),
      ...tagAround("amenity", "cinema"),
      ...tagAround("amenity", "theatre"),
    ];
  }
  if (category === "gastro_experience") {
    return [
      ...tagAround("tourism", "wine_cellar"),
      ...tagAround("craft", "brewery"),
      ...tagAround("craft", "winery"),
      ...tagAround("amenity", "cooking_school"),
      ...tagAround("tourism", "attraction"),
    ];
  }
  if (category === "excursion") {
    return [
      ...tagAround("tourism", "attraction"),
      ...tagAround("leisure", "park"),
      ...tagAround("natural", "peak"),
      ...tagAround("natural", "waterfall"),
    ];
  }
  if (category === "neighborhood") {
    return [
      ...tagAround("place", "neighbourhood"),
      ...tagAround("place", "suburb"),
      ...tagAround("tourism", "attraction"),
    ];
  }
  return [];
}

/**
 * Busca POIs cerca usando Overpass (OSM).
 * Devuelve items con nombre + coords + osm id, para que el generador NO invente.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const center = body?.center;
    const category = String(body?.category || "").trim() as PoiCategoryKey;
    const radiusMetersRaw = typeof body?.radiusMeters === "number" ? body.radiusMeters : Number(body?.radiusMeters ?? 3500);
    const limitRaw = typeof body?.limit === "number" ? body.limit : Number(body?.limit ?? 30);

    if (!isLatLng(center)) return NextResponse.json({ error: "center debe ser {lat,lng}." }, { status: 400 });
    const allowed: PoiCategoryKey[] = ["culture", "nature", "viewpoint", "neighborhood", "market", "excursion", "gastro_experience", "shopping", "night"];
    if (!allowed.includes(category)) return NextResponse.json({ error: "category inválida." }, { status: 400 });

    const radiusMeters = clamp(Number.isFinite(radiusMetersRaw) ? radiusMetersRaw : 3500, 200, 40000);
    const limit = clamp(Number.isFinite(limitRaw) ? limitRaw : 30, 1, 50);

    const blocks = buildCategoryBlocks(category, radiusMeters, center.lat, center.lng);
    if (!blocks.length) return NextResponse.json({ pois: [] });

    const query = `
[out:json][timeout:20];
(
${blocks.map((x) => `  ${x}`).join("\n")}
);
out center tags ${Math.max(50, limit * 6)};
`.trim();

    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
    });

    const payload: unknown = await resp.json().catch(() => null);
    if (!resp.ok) {
      return NextResponse.json({ error: "No se pudo buscar POIs (Overpass)." }, { status: 502 });
    }

    const elements = parseOverpassElements(payload);
    const seen = new Set<string>();

    const rows = elements
      .map((el) => {
        const tags = el?.tags && typeof el.tags === "object" ? (el.tags as Record<string, unknown>) : {};
        const name = nameFromTags(tags);
        const ll = elementLatLng(el);
        const id = String(el?.id || "");
        const type = String(el?.type || "node");
        if (!name || !ll || !id) return null;
        const key = `${type}:${id}`.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        return {
          osm: { type, id },
          name,
          lat: ll.lat,
          lng: ll.lng,
          tags,
        };
      })
      .filter(Boolean) as Array<{ osm: { type: string; id: string }; name: string; lat: number; lng: number; tags: Record<string, unknown> }>;

    return NextResponse.json({ category, center, radiusMeters, pois: rows.slice(0, limit) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo buscar POIs." }, { status: 500 });
  }
}

