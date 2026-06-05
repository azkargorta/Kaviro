import { NextResponse } from "next/server";
import { isLatLng } from "@/lib/geo/lat-lng";
import { parseOverpassElements } from "@/lib/osm/overpass-types";

export const runtime = "nodejs";
export const maxDuration = 30;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Busca restaurantes cerca usando Overpass (OSM).
 * Nota: es un servicio público, mantenemos limit/radius moderados.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const center = body?.center;
    const radiusMetersRaw = typeof body?.radiusMeters === "number" ? body.radiusMeters : Number(body?.radiusMeters ?? 1200);
    const limitRaw = typeof body?.limit === "number" ? body.limit : Number(body?.limit ?? 8);

    if (!isLatLng(center)) {
      return NextResponse.json({ error: "center debe ser {lat,lng}." }, { status: 400 });
    }

    const radiusMeters = clamp(Number.isFinite(radiusMetersRaw) ? radiusMetersRaw : 1200, 200, 4000);
    const limit = clamp(Number.isFinite(limitRaw) ? limitRaw : 8, 1, 20);

    // Overpass QL: amenity=restaurant alrededor del punto.
    const query = `
[out:json][timeout:20];
(
  node["amenity"="restaurant"](around:${Math.floor(radiusMeters)},${center.lat},${center.lng});
  way["amenity"="restaurant"](around:${Math.floor(radiusMeters)},${center.lat},${center.lng});
  relation["amenity"="restaurant"](around:${Math.floor(radiusMeters)},${center.lat},${center.lng});
);
out center tags ${Math.max(20, limit * 5)};
`.trim();

    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
    });

    const payload: unknown = await resp.json().catch(() => null);
    if (!resp.ok) {
      return NextResponse.json({ error: "No se pudo buscar restaurantes (Overpass)." }, { status: 502 });
    }

    const rows = parseOverpassElements(payload)
      .map((el) => {
        const tags = el.tags ?? {};
        const name = typeof tags.name === "string" ? tags.name.trim() : "";
        const website = typeof tags.website === "string" ? tags.website.trim() : null;
        const lat = typeof el.lat === "number" ? el.lat : typeof el.center?.lat === "number" ? el.center.lat : null;
        const lng = typeof el.lon === "number" ? el.lon : typeof el.center?.lon === "number" ? el.center.lon : null;
        if (!name || lat == null || lng == null) return null;
        return {
          osm: { type: String(el.type || "node"), id: String(el.id || "") },
          name,
          website,
          lat,
          lng,
        };
      })
      .filter(Boolean) as Array<{
        osm: { type: string; id: string };
        name: string;
        website: string | null;
        lat: number;
        lng: number;
      }>;

    return NextResponse.json({ restaurants: rows.slice(0, limit) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo buscar restaurantes." },
      { status: 500 }
    );
  }
}
