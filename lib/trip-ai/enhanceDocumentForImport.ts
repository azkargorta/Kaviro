import { extractFirstJsonObject } from "@/lib/ai/llmJson";
import type { DetectedDocumentData } from "@/lib/document-analyzer";
import {
  normalizeAgencyCalendarSourceText,
  splitSourceByDayMarkers,
} from "@/lib/trip-ai/agencyCalendarParse";
import { countDaySectionsInSource } from "@/lib/trip-ai/itineraryDraftUtils";
import { askTripAIWithUsage, type TripAiUsage } from "@/lib/trip-ai/providers";

export type DocumentImportInsights = {
  documentType?: string | null;
  tripTitle?: string | null;
  hotels?: Array<{ name?: string; city?: string; checkIn?: string; checkOut?: string }>;
  flights?: Array<{ route?: string; date?: string; time?: string; flightNumber?: string }>;
  dayCount?: number | null;
  summary?: string | null;
};

function appendDetectedDayHeaders(lines: string[], sourceText: string) {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  const sectionCount = countDaySectionsInSource(normalized);
  const markers = splitSourceByDayMarkers(normalized);
  if (sectionCount >= 2) {
    lines.push(`Días detectados en dossier: ${sectionCount}`);
    if (markers.length >= 2) {
      lines.push(
        `Encabezados de día (orden): ${markers
          .slice(0, 20)
          .map((m) => m.header)
          .join(" · ")}`
      );
    }
  }
}

function formatInsightsForHint(
  insights: DocumentImportInsights,
  detected: DetectedDocumentData,
  sourceText?: string
): string {
  const lines: string[] = [];
  if (insights.documentType) lines.push(`Tipo: ${insights.documentType}`);
  if (insights.tripTitle) lines.push(`Título viaje: ${insights.tripTitle}`);
  if (insights.dayCount) lines.push(`Días detectados en dossier: ${insights.dayCount}`);
  if (sourceText) appendDetectedDayHeaders(lines, sourceText);
  if (insights.summary) lines.push(`Resumen: ${insights.summary}`);
  if (insights.hotels?.length) {
    lines.push(
      "Hoteles:",
      ...insights.hotels.slice(0, 8).map((h) =>
        [
          h.name,
          h.city ? `(${h.city})` : "",
          h.checkIn ? `in ${h.checkIn}` : "",
          h.checkOut ? `out ${h.checkOut}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      )
    );
  }
  if (insights.flights?.length) {
    lines.push(
      "Vuelos:",
      ...insights.flights.slice(0, 12).map((f) =>
        [f.date, f.time, f.route, f.flightNumber].filter(Boolean).join(" · ")
      )
    );
  }
  if (detected.reservationCode) lines.push(`Localizador: ${detected.reservationCode}`);
  if (detected.providerName) lines.push(`Proveedor: ${detected.providerName}`);
  return lines.join("\n");
}

export async function enhanceDocumentForItineraryImport(params: {
  extractedText: string;
  fileName: string;
  tripSummary: string;
  detected: DetectedDocumentData;
}): Promise<{ hint: string; insights: DocumentImportInsights | null; usage: TripAiUsage | null }> {
  const text = params.extractedText.trim();
  if (text.length < 80) {
    return { hint: formatInsightsForHint({}, params.detected, text), insights: null, usage: null };
  }

  const prompt = [
    "Analiza este dossier/calendario de viaje y devuelve SOLO JSON válido:",
    "{",
    '  "documentType": "travel_itinerary|hotel_voucher|flight_ticket|mixed",',
    '  "tripTitle": "string|null",',
    '  "dayCount": number|null,',
    '  "summary": "string|null",',
    '  "hotels": [{ "name": "string", "city": "string|null", "checkIn": "YYYY-MM-DD|null", "checkOut": "YYYY-MM-DD|null" }],',
    '  "flights": [{ "route": "string", "date": "YYYY-MM-DD|null", "time": "HH:MM|null", "flightNumber": "string|null" }]',
    "}",
    "Extrae todos los hoteles y vuelos visibles. dayCount = nº de días del calendario.",
    "",
    `Archivo: ${params.fileName}`,
    params.tripSummary ? `Viaje en app: ${params.tripSummary.slice(0, 400)}` : "",
    "",
    "TEXTO:",
    text.slice(0, 14000),
  ].join("\n");

  try {
    const { text: answer, usage } = await askTripAIWithUsage(prompt, "planning", {
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    });
    const parsed = extractFirstJsonObject(answer) as DocumentImportInsights | null;
    const hint = parsed
      ? formatInsightsForHint(parsed, params.detected, text)
      : formatInsightsForHint({}, params.detected, text);
    return { hint, insights: parsed, usage };
  } catch {
    return {
      hint: formatInsightsForHint({}, params.detected, text),
      insights: null,
      usage: null,
    };
  }
}

export function buildImportHintFromDetected(detected: DetectedDocumentData): string {
  return formatInsightsForHint({}, detected);
}
