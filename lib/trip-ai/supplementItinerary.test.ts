import { describe, expect, it } from "vitest";
import { ARGENTINA_OFFICIAL_PDF_SNIPPET } from "@/lib/trip-ai/argentinaOfficialPdfFixture";
import { ARGENTINA_TRIP_SUMMARY } from "@/lib/trip-ai/argentinaStripesFixture";
import {
  dedupeImportSectionsByDate,
  isAgencyCalendarParseAcceptable,
  parseAgencyCalendarItinerary,
  parseDocumentTripRangeFromText,
  splitSourceByDayMarkers,
} from "@/lib/trip-ai/agencyCalendarParse";
import { supplementItineraryFromSourceSections } from "@/lib/trip-ai/importItineraryFromText";
import { normalizeAgencyCalendarSourceText } from "@/lib/trip-ai/agencyCalendarParse";

describe("parseDocumentTripRangeFromText", () => {
  it("lee el rango del encabezado del dossier", () => {
    expect(parseDocumentTripRangeFromText(ARGENTINA_OFFICIAL_PDF_SNIPPET)).toEqual({
      start: "2026-11-27",
      end: "2026-12-08",
    });
  });
});

describe("dedupeImportSectionsByDate", () => {
  it("colapsa bloques duplicados del mismo día (narrativa + calendario)", () => {
    const normalized = normalizeAgencyCalendarSourceText(ARGENTINA_OFFICIAL_PDF_SNIPPET);
    const raw = splitSourceByDayMarkers(normalized);
    expect(raw.length).toBeGreaterThan(12);
    const deduped = dedupeImportSectionsByDate(raw, ARGENTINA_TRIP_SUMMARY, normalized);
    expect(deduped.length).toBe(12);
  });
});

describe("parseAgencyCalendarItinerary", () => {
  it("genera 12 días para el PDF oficial con fechas del viaje", () => {
    const parsed = parseAgencyCalendarItinerary(
      normalizeAgencyCalendarSourceText(ARGENTINA_OFFICIAL_PDF_SNIPPET),
      ARGENTINA_TRIP_SUMMARY
    );
    expect(parsed?.days).toHaveLength(12);
    expect(isAgencyCalendarParseAcceptable(parsed!, ARGENTINA_OFFICIAL_PDF_SNIPPET, ARGENTINA_TRIP_SUMMARY)).toBe(
      true
    );
  });
});

describe("supplementItineraryFromSourceSections", () => {
  it("completa días cuando el viaje en app no coincide con las fechas del dossier", () => {
    const mismatchedTrip =
      "Viaje: Prueba | Fechas: 2026-03-01 → 2026-03-12 | Moneda: EUR";
    const sparse = {
      version: 1 as const,
      days: [
        {
          day: 1,
          date: "2026-03-01",
          items: [{ title: "Solo un día", start_time: "10:00" }],
        },
      ],
    };
    const out = supplementItineraryFromSourceSections(
      sparse,
      normalizeAgencyCalendarSourceText(ARGENTINA_OFFICIAL_PDF_SNIPPET),
      mismatchedTrip
    );
    expect(out.days.length).toBeGreaterThanOrEqual(10);
    expect(out.days.some((d) => (d.items?.length ?? 0) >= 3)).toBe(true);
  });

  it("no reduce un itinerario ya completo", () => {
    const full = supplementItineraryFromSourceSections(
      {
        version: 1,
        days: [
          "2026-11-27",
          "2026-11-28",
          "2026-11-29",
          "2026-11-30",
          "2026-12-01",
          "2026-12-02",
          "2026-12-03",
          "2026-12-04",
          "2026-12-05",
          "2026-12-06",
          "2026-12-07",
          "2026-12-08",
        ].map((date, i) => ({
          day: i + 1,
          date,
          items: [{ title: `Act ${i}`, start_time: "09:00" }],
        })),
      },
      normalizeAgencyCalendarSourceText(ARGENTINA_OFFICIAL_PDF_SNIPPET),
      ARGENTINA_TRIP_SUMMARY
    );
    expect(full.days.length).toBe(12);
  });
});
