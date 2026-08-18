import { askGemini } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { PlannerBrief } from "@/lib/trip-ai/plannerBrief";
import type { ArchitectDay, TripArchitecture } from "@/lib/trip-ai/plannerArchitect";
import type { PlannerDay, PlannerDayItem } from "@/lib/trip-ai/itineraryDedup";
import { roundedDriveHours } from "@/lib/trip-ai/plannerStayRoute";
import { addDaysIso } from "@/lib/trip-ai/tripCreationDates";

type LatLng = { lat: number; lng: number };

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function kindOf(raw: string): string {
  const k = raw.toLowerCase();
  if (["culture", "nature", "viewpoint", "neighborhood", "market", "excursion", "gastro_experience", "shopping", "night", "transport", "rest"].includes(k)) {
    return k;
  }
  if (/bodega|vino|cata/.test(k)) return "gastro_experience";
  if (/traslado|transfer|aeropuerto/.test(k)) return "transport";
  if (/llegada|descanso|noche/.test(k)) return "rest";
  return "excursion";
}

export function buildWholeTripPrompt(params: {
  brief: PlannerBrief | null;
  notes: string;
  stops: Array<{ label: string; center: LatLng }>;
  architecture: TripArchitecture;
  totalDays: number;
  startDate: string;
  endDate: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  alreadyPlanned?: string[];
  daySlice?: { from: number; to: number };
}): string {
  const stops = params.stops.map((s) => s.label).join(", ");
  const legs = params.stops
    .flatMap((a, i) =>
      params.stops.slice(i + 1).map((b) => `- ${a.label} ↔ ${b.label}: unas ${roundedDriveHours(a.center, b.center)} h de coche`)
    )
    .join("\n");
  const from = params.daySlice?.from ?? 1;
  const to = params.daySlice?.to ?? params.totalDays;
  const skeleton = params.architecture.days
    .filter((d) => d.dayNum >= from && d.dayNum <= to)
    .map((d) => {
      const anchors = d.mainActivities.length ? d.mainActivities.join("; ") : "elige tú las anclas reales";
      return `Día ${d.dayNum} ${d.date} [${d.dayType}] duerme en ${d.base}${d.transferFrom ? ` | traslado ${d.transferFrom} → ${d.transferTo || d.base}` : ""} | ${d.summary} | anclas: ${anchors}`;
    })
    .join("\n");
  const used = (params.alreadyPlanned || []).length
    ? `Ya programado en días anteriores (NO repetir): ${params.alreadyPlanned!.join("; ")}.`
    : "";
  const interests = params.brief?.interests?.length ? params.brief.interests.join(", ") : "no especificados";
  const pace = params.brief?.pace || "balanced";
  const company = params.brief?.travelersType || "no especificada";

  return `Eres un diseñador de viajes experto. Diseñas el viaje ENTERO como haría un humano que conoce la zona, no como un buscador de POIs.

NO rellenes con museos municipales, plazas, iglesias o "casco histórico" salvo que sean realmente icónicos y encajen con el viajero.
SÍ elige las experiencias que hacen famosa esa región y que encajan con compañía (${company}), intereses (${interests}) y ritmo (${pace}).

Devuelve SOLO JSON:
{"days":[{"day":1,"date":"YYYY-MM-DD","base":"Ciudad donde se duerme","items":[{"t":"Nombre propio real","d":"Por qué hoy y cuánto tarda","h":"10:00","k":"excursion","lt":-24.1,"lg":-65.3}]}]}

k debe ser uno de: culture, nature, viewpoint, excursion, gastro_experience, market, neighborhood, transport, rest.

REGLAS (valen para CUALQUIER destino del mundo):
1. Piensa el arco del viaje: llegada → zona más suave o próxima al hub → experiencias fuertes → vuelta con margen.
2. Cada día COMPLETO tiene 1 ancla principal y como máximo 2 secundarias. Deja 2 h entre anclas para comer, aparcar y retrasos. Hueco 13:00-14:30 para comer.
3. Día de llegada (${params.arrivalTime || "hora desconocida"}): traslado y descanso. Cero turismo si se llega a última hora.
4. Día de salida (${params.departureTime || "hora desconocida"}): nada que impida devolver coche y estar 3 h antes en aeropuerto/estación. Si hay parada, que esté EN la ruta de vuelta.
5. Traslado: usa las horas de coche de abajo. Las visitas de ese día son paradas EN la carretera, con hora posterior a la salida + el tramo real. Nunca pongas a las 09:30 un sitio del destino si el coche tarda 4 h.
6. No repitas la misma ancla (ni variantes del mismo nombre) en dos días.
7. Si hay naturaleza en los intereses, las anclas fuertes son paisajes y excursiones de la zona (las que saldrían en una buena guía), no el museo del pueblo.
8. Si hay vino/gastronomía y se conduce, máximo 1 bodega por día y 2 en todo el viaje.
9. Si hay valles y alta montaña, no pongas la mayor altitud el primer día útil.
10. Nombres propios reales, verificables. Coordenadas reales o null. Nunca 0,0.
11. Respeta dónde se DUERME cada noche del esqueleto. Puedes mejorar las anclas si conoces una experiencia mejor.
12. Cubre TODOS los días ${from} a ${to} del viaje (${params.totalDays} días en total, ${params.startDate} → ${params.endDate}).

Esqueleto (bases y tipo de día, obligatorio):
${skeleton}

Distancias en coche:
${legs || "- sin pares"}

Notas del viajero: ${params.notes || "sin notas"}
${used}

Brief: ${JSON.stringify(params.brief || null)}`;
}

export function parseWholeTripDays(
  raw: unknown,
  params: { startDate: string; totalDays: number; architecture: TripArchitecture }
): PlannerDay[] {
  const data = raw && typeof raw === "object" ? (raw as { days?: unknown[] }) : null;
  const rows = Array.isArray(data?.days) ? data!.days! : [];
  const byNum = new Map<number, PlannerDay>();
  for (const row of rows) {
    const d = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
    if (!d) continue;
    const dayNum = Math.max(1, Math.round(Number(d.day || d.dayNum) || 0));
    if (!dayNum) continue;
    const arch = params.architecture.days.find((x) => x.dayNum === dayNum);
    const date = clean(d.date) || arch?.date || addDaysIso(params.startDate, dayNum - 1);
    const base = clean(d.base) || arch?.base || "";
    const rawItems = Array.isArray(d.items) ? d.items : [];
    const items: PlannerDayItem[] = [];
    for (const itRaw of rawItems) {
      const it = itRaw && typeof itRaw === "object" ? (itRaw as Record<string, unknown>) : null;
      if (!it) continue;
      const title = clean(it.t || it.title);
      if (!title) continue;
      const latRaw = it.lt ?? it.latitude;
      const lngRaw = it.lg ?? it.longitude;
      const lat = typeof latRaw === "number" && Math.abs(latRaw) <= 90 && latRaw !== 0 ? latRaw : null;
      const lng = typeof lngRaw === "number" && Math.abs(lngRaw) <= 180 && lngRaw !== 0 ? lngRaw : null;
      items.push({
        title,
        description: clean(it.d || it.description) || null,
        activity_date: date,
        activity_time: clean(it.h || it.activity_time) || null,
        place_name: clean(it.place_name) || title,
        address: clean(it.address) || `${title}, ${base}`,
        latitude: lat,
        longitude: lng,
        activity_kind: kindOf(clean(it.k || it.activity_kind)),
        activity_type: "visit",
        source: "ai_planner_whole",
      });
    }
    byNum.set(dayNum, { day: dayNum, date, base, items });
  }

  const out: PlannerDay[] = [];
  for (let n = 1; n <= params.totalDays; n++) {
    const arch: ArchitectDay | undefined = params.architecture.days.find((x) => x.dayNum === n);
    const existing = byNum.get(n);
    out.push(
      existing || {
        day: n,
        date: arch?.date || addDaysIso(params.startDate, n - 1),
        base: arch?.base || "",
        items: (arch?.mainActivities || []).map((title, i) => ({
          title,
          description: arch?.summary || null,
          activity_date: arch?.date || addDaysIso(params.startDate, n - 1),
          activity_time: ["10:00", "12:00", "15:30"][i] || "10:00",
          place_name: title,
          address: `${title}, ${arch?.base || ""}`,
          latitude: null,
          longitude: null,
          activity_kind: arch?.dayType === "arrival" ? "rest" : "excursion",
          activity_type: "visit",
          source: "ai_planner_architect",
        })),
      }
    );
  }
  return out;
}

export async function generateWholeTripItinerary(params: {
  brief: PlannerBrief | null;
  notes: string;
  stops: Array<{ label: string; center: LatLng }>;
  architecture: TripArchitecture;
  totalDays: number;
  startDate: string;
  endDate: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
}): Promise<PlannerDay[]> {
  const chunkSize = params.totalDays <= 8 ? params.totalDays : 6;
  const already: string[] = [];
  const merged: PlannerDay[] = [];
  for (let from = 1; from <= params.totalDays; from += chunkSize) {
    const to = Math.min(params.totalDays, from + chunkSize - 1);
    const prompt = buildWholeTripPrompt({ ...params, alreadyPlanned: already, daySlice: { from, to } });
    try {
      const raw = await askGemini(prompt, "planning", {
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      });
      const parsed = extractJsonObject(raw);
      const days = parseWholeTripDays(parsed, params).filter((d) => d.day >= from && d.day <= to);
      for (const d of days) {
        merged.push(d);
        for (const it of d.items || []) {
          const t = String(it.title || "").trim();
          if (t) already.push(t);
        }
      }
    } catch {
      break;
    }
  }
  if (!merged.length) return [];
  const byNum = new Map(merged.map((d) => [d.day, d]));
  return parseWholeTripDays({ days: merged }, params).map((d) => byNum.get(d.day) || d);
}
