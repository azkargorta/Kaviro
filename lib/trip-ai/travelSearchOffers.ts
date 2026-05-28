/**
 * Ofertas / opciones de búsqueda (modo search) emitidas por el asistente.
 * JSON entre KAVIRO_SEARCH_JSON_*; enlaces de reserva se enriquecen con trip-search-urls.
 */

import type { SearchPlatform, TripType } from "@/lib/trip-search-urls";
import {
  extractJsonBetweenMarkers,
  KAVIRO_SEARCH_JSON_END,
  KAVIRO_SEARCH_JSON_START,
  SEARCH_JSON_END_ALIASES,
  SEARCH_JSON_START_ALIASES,
} from "@/lib/trip-ai/kaviroJsonMarkers";
import {
  busPlatformUrls,
  carPlatformUrls,
  ferryPlatformUrls,
  flightPlatformUrls,
  hotelPlatformUrls,
  trainPlatformUrls,
} from "@/lib/trip-search-urls";

/** Marcadores canónicos (alias export para código existente). */
export const SEARCH_JSON_START = KAVIRO_SEARCH_JSON_START;
export const SEARCH_JSON_END = KAVIRO_SEARCH_JSON_END;

export type SearchCategory = "hotel" | "vuelo" | "tren" | "ferry" | "bus" | "coche";

export type TravelSearchOption = {
  name: string;
  description: string | null;
  priceHint: string | null;
  priceNote: string | null;
  bookingUrl: string | null;
};

export type TravelSearchParams = {
  origin: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  adults: number | null;
  tripType: TripType | null;
  pickup: string | null;
  dropoff: string | null;
  luggage: number | null;
};

export type TravelSearchOffersPayload = {
  version: 1;
  category: SearchCategory;
  title: string;
  intro: string | null;
  tripLine: string | null;
  searchParams: TravelSearchParams;
  options: TravelSearchOption[];
  tip: string | null;
};

export type EnrichedTravelSearchPayload = TravelSearchOffersPayload & {
  platforms: SearchPlatform[];
};

export type TripSearchDefaults = {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
};

const CATEGORY_ALIASES: Record<string, SearchCategory> = {
  hotel: "hotel",
  hoteles: "hotel",
  alojamiento: "hotel",
  alojamientos: "hotel",
  vuelo: "vuelo",
  vuelos: "vuelo",
  avion: "vuelo",
  avión: "vuelo",
  flight: "vuelo",
  tren: "tren",
  trenes: "tren",
  train: "tren",
  ferry: "ferry",
  ferries: "ferry",
  barco: "ferry",
  bus: "bus",
  autobus: "bus",
  autobús: "bus",
  coche: "coche",
  coche_alquiler: "coche",
  alquiler: "coche",
  rental: "coche",
  rent_a_car: "coche",
};

function normalizeCategory(raw: unknown): SearchCategory {
  const s = String(raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  return CATEGORY_ALIASES[s] || "hotel";
}

function normalizeTripType(raw: unknown): TripType | null {
  const s = String(raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s.includes("vuelta") || s.includes("round") || s.includes("return")) return "ida-vuelta";
  if (s.includes("ida")) return "ida";
  return null;
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function isoOrNull(v: unknown): string | null {
  const s = strOrNull(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function parseSearchParams(raw: unknown): TravelSearchParams {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const adultsRaw = row.adults ?? row.passengers ?? row.viajeros;
  const adultsNum = typeof adultsRaw === "number" ? adultsRaw : Number(adultsRaw);
  return {
    origin: strOrNull(row.origin ?? row.origen),
    destination: strOrNull(row.destination ?? row.destino),
    startDate: isoOrNull(row.startDate ?? row.start_date ?? row.fechaIda ?? row.checkin),
    endDate: isoOrNull(row.endDate ?? row.end_date ?? row.fechaVuelta ?? row.checkout),
    adults: Number.isFinite(adultsNum) && adultsNum > 0 ? Math.round(adultsNum) : null,
    tripType: normalizeTripType(row.tripType ?? row.trip_type ?? row.tipo),
    pickup: strOrNull(row.pickup ?? row.recogida),
    dropoff: strOrNull(row.dropoff ?? row.devolucion),
    luggage: typeof row.luggage === "number" && row.luggage >= 0 ? row.luggage : null,
  };
}

function parseOptions(raw: unknown): TravelSearchOption[] {
  if (!Array.isArray(raw)) return [];
  const out: TravelSearchOption[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const row = it as Record<string, unknown>;
    const name = strOrNull(row.name ?? row.nombre);
    if (!name) continue;
    const url = strOrNull(row.bookingUrl ?? row.booking_url ?? row.url);
    out.push({
      name,
      description: strOrNull(row.description ?? row.descripcion),
      priceHint: strOrNull(row.priceHint ?? row.price_hint ?? row.precio),
      priceNote: strOrNull(row.priceNote ?? row.price_note),
      bookingUrl: url && /^https?:\/\//i.test(url) ? url : null,
    });
  }
  return out;
}

export function parseTravelSearchOffersFromAnswer(answer: string): TravelSearchOffersPayload | null {
  const raw = extractJsonBetweenMarkers(answer, SEARCH_JSON_START_ALIASES, SEARCH_JSON_END_ALIASES);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || parsed.version !== 1) return null;
    const options = parseOptions(parsed.options);
    if (!options.length) return null;
    const category = normalizeCategory(parsed.category);
    const title = strOrNull(parsed.title) || `Búsqueda: ${categoryLabel(category)}`;
    return {
      version: 1,
      category,
      title,
      intro: strOrNull(parsed.intro),
      tripLine: strOrNull(parsed.tripLine ?? parsed.trip_line),
      searchParams: parseSearchParams(parsed.searchParams ?? parsed.search_params),
      options,
      tip: strOrNull(parsed.tip ?? parsed.consejo),
    };
  } catch {
    return null;
  }
}

export function categoryLabel(category: SearchCategory): string {
  switch (category) {
    case "hotel":
      return "Alojamiento";
    case "vuelo":
      return "Vuelos";
    case "tren":
      return "Tren";
    case "ferry":
      return "Ferry";
    case "bus":
      return "Autobús";
    case "coche":
      return "Coche de alquiler";
    default:
      return "Búsqueda";
  }
}

function mergeParams(
  payload: TravelSearchOffersPayload,
  defaults: TripSearchDefaults | undefined
): Required<Pick<TravelSearchParams, "destination" | "startDate" | "endDate" | "adults">> &
  TravelSearchParams {
  const sp = payload.searchParams;
  const dest =
    sp.destination ||
    (payload.category === "coche" ? null : defaults?.destination) ||
    defaults?.destination ||
    "Destino del viaje";
  const start = sp.startDate || defaults?.startDate || "";
  const end = sp.endDate || defaults?.endDate || start;
  const adults = sp.adults || defaults?.adults || 2;
  return {
    ...sp,
    origin: sp.origin || (payload.category !== "hotel" && payload.category !== "coche" ? "Madrid" : null),
    destination: dest,
    startDate: start,
    endDate: end,
    adults,
    tripType: sp.tripType || (start && end && start !== end ? "ida-vuelta" : "ida"),
    pickup: sp.pickup || dest,
    dropoff: sp.dropoff || dest,
    luggage: sp.luggage ?? 1,
  };
}

export function enrichTravelSearchOffers(
  payload: TravelSearchOffersPayload,
  defaults?: TripSearchDefaults
): EnrichedTravelSearchPayload {
  const p = mergeParams(payload, defaults);
  const tripType: TripType = p.tripType === "ida" ? "ida" : "ida-vuelta";

  let platforms: SearchPlatform[] = [];
  switch (payload.category) {
    case "hotel":
      platforms = hotelPlatformUrls({
        destination: p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || p.startDate || "",
        adults: p.adults || 2,
      });
      break;
    case "coche":
      platforms = carPlatformUrls({
        pickup: p.pickup || p.destination || "",
        dropoff: p.dropoff || p.pickup || p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || p.startDate || "",
        adults: p.adults || 2,
        luggage: p.luggage ?? 1,
      });
      break;
    case "vuelo":
      platforms = flightPlatformUrls({
        origin: p.origin || "Madrid",
        destination: p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        adults: p.adults || 2,
        tripType,
      });
      break;
    case "tren":
      platforms = trainPlatformUrls({
        origin: p.origin || "Madrid",
        destination: p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        adults: p.adults || 2,
        tripType,
      });
      break;
    case "ferry":
      platforms = ferryPlatformUrls({
        origin: p.origin || "",
        destination: p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        adults: p.adults || 2,
        tripType,
      });
      break;
    case "bus":
      platforms = busPlatformUrls({
        origin: p.origin || "Madrid",
        destination: p.destination || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        adults: p.adults || 2,
        tripType,
      });
      break;
    default:
      break;
  }

  return { ...payload, searchParams: p, platforms };
}

export function buildSearchModeContextHint(): string {
  return [
    "Modo búsqueda de alojamiento y transporte:",
    "- Usa destino, fechas y número de participantes del resumen del viaje.",
    "- Si falta origen en vuelos/tren/bus, asume Madrid salvo que el usuario indique otra ciudad.",
    "- Los precios en options deben ser estimaciones orientativas (nunca inventes tarifas en tiempo real sin indicarlo en priceNote).",
    "- Incluye siempre el bloque KAVIRO_SEARCH_JSON cuando des opciones concretas.",
    "- bookingUrl en cada option puede ser null; la app mostrará enlaces a comparadores (Booking, Google Flights, Omio, etc.).",
  ].join("\n");
}
