import { askGemini } from "@/lib/trip-ai/providers";

export type AccommodationBasePlace = { name: string; lat: number; lng: number };

function parsePlacesArray(raw: string): AccommodationBasePlace[] {
  const text = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const startArr = text.indexOf("[");
  const endArr = text.lastIndexOf("]");
  if (startArr < 0 || endArr <= startArr) return [];
  const arr = JSON.parse(text.slice(startArr, endArr + 1));
  if (!Array.isArray(arr)) return [];

  const out: AccommodationBasePlace[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const name = String((item as { name?: string })?.name || "").trim();
    const lat = typeof (item as { lat?: number }).lat === "number" ? (item as { lat: number }).lat : null;
    const lng = typeof (item as { lng?: number }).lng === "number" ? (item as { lng: number }).lng : null;
    if (!name || lat === null || lng === null) continue;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, lat, lng });
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

  const want = Math.min(Math.max(limit, 8), 24);

  const prompt = `El viajero planifica un viaje a "${region}" (destino amplio: país, región autónoma, provincia, costa, isla, etc.).

Tu tarea: proponer ${want} CIUDADES o PUEBLOS REALES dentro de "${region}" que sean buenas BASES DE ALOJAMIENTO para turistas — lugares conocidos, con hoteles/hostales/apartamentos, desde donde se visita la zona.
${excludeLine}

Prioriza:
- Los más turísticos y visitados internacionalmente o nacionalmente
- Municipios donde la gente suele dormir varias noches (no solo una atracción de día sin alojamiento)
- Variedad geográfica si la región es grande (costa + interior, etc.) cuando tenga sentido

Devuelve SOLO un array JSON válido (sin markdown):
[{"name":"Oviedo","lat":43.3619,"lng":-5.8494}, ...]

Reglas estrictas:
- Solo localidades reales (ciudad, pueblo, villa turística). NUNCA devuelvas solo "${region}" si es una región.
- Orden: de más a menos recomendado como base turística.
- Coordenadas lat/lng del centro del municipio, números reales.
- PROHIBIDO: países, continentes, regiones administrativas genéricas, lugares inventados.`;

  const raw = await askGemini(prompt, "planning", { maxOutputTokens: 1536 });
  const parsed = parsePlacesArray(raw);
  const excludeSet = new Set(excludeClean.map((n) => n.toLowerCase()));
  return parsed.filter((p) => !excludeSet.has(p.name.toLowerCase())).slice(0, limit);
}
