import { describe, expect, it } from "vitest";
import {
  isolateChunkBodyForLabel,
  mergeImportedItineraries,
  normalizeChunkImportResult,
  parseScheduleSlotsFromSection,
  sanitizeItineraryBySourceSections,
  splitSourceByTimeSlots,
  splitSourceForImport,
} from "@/lib/trip-ai/importItineraryFromText";
import { looksLikeAgencyWeekdayCalendar } from "@/lib/trip-ai/agencyCalendarParse";
import {
  PARIS_DAY_FORMAT_CALENDAR,
  PARIS_TRIP_SUMMARY,
  SCANDINAVIA_TIME_SLOTS,
  SCANDINAVIA_TRIP_SUMMARY,
} from "@/lib/trip-ai/genericImportFixtures";

describe("importación genérica (no Argentina)", () => {
  it("París: parte en 4 trozos por Day N (aunque tenga muchas horas)", () => {
    expect(looksLikeAgencyWeekdayCalendar(PARIS_DAY_FORMAT_CALENDAR)).toBe(true);
    const sections = splitSourceForImport(PARIS_DAY_FORMAT_CALENDAR, PARIS_TRIP_SUMMARY).filter(
      (s) => s.header !== "Todo"
    );
    expect(sections).toHaveLength(4);
    expect(sections[3]?.header).toMatch(/Day\s+4/i);
  });

  it("París: último tramo con itinerario completo repetido → 2 actividades", () => {
    const sections = splitSourceForImport(PARIS_DAY_FORMAT_CALENDAR, PARIS_TRIP_SUMMARY).filter(
      (s) => s.header !== "Todo"
    );
    const last = sections[sections.length - 1]!;
    const isolated = isolateChunkBodyForLabel(last.header, `${last.body}\n${PARIS_DAY_FORMAT_CALENDAR}`);
    expect(parseScheduleSlotsFromSection(isolated)).toHaveLength(2);

    const pollution = sections.flatMap((s) =>
      parseScheduleSlotsFromSection(s.body).map((slot) => ({
        title: `Copia ${slot.label}`,
        start_time: slot.time,
      }))
    );

    const normalized = normalizeChunkImportResult(
      {
        version: 1,
        days: [{ day: 1, date: null, items: pollution }],
      },
      last.header,
      `${last.body}\n${PARIS_DAY_FORMAT_CALENDAR}`,
      PARIS_TRIP_SUMMARY,
      {
        sourceText: PARIS_DAY_FORMAT_CALENDAR,
        sectionIndex: sections.length - 1,
        totalSections: sections.length,
      }
    );
    expect(normalized.days[0]?.date).toBe("2026-04-13");
    expect(normalized.days[0]?.items).toHaveLength(2);
    expect(normalized.days[0]?.items?.map((it) => it.start_time)).toEqual(["08:00", "16:00"]);
  });

  it("Fiordos: troceo por horas si no hay encabezados de día", () => {
    expect(splitSourceByTimeSlots(SCANDINAVIA_TIME_SLOTS, 4).length).toBeGreaterThanOrEqual(2);
    const sections = splitSourceForImport(SCANDINAVIA_TIME_SLOTS, SCANDINAVIA_TRIP_SUMMARY);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0]?.header).toMatch(/Tramo/i);
  });

  it("Fiordos: merge + sanitize mantiene cada tramo acotado", () => {
    const sections = splitSourceForImport(SCANDINAVIA_TIME_SLOTS, SCANDINAVIA_TRIP_SUMMARY).filter(
      (s) => s.body.trim()
    );
    const parts = sections.map((section, i) =>
      normalizeChunkImportResult(
        {
          version: 1,
          days: [
            {
              day: 1,
              date: null,
              items: [{ title: section.header, start_time: "08:00" }],
            },
          ],
        },
        section.header,
        section.body,
        SCANDINAVIA_TRIP_SUMMARY,
        {
          sourceText: SCANDINAVIA_TIME_SLOTS,
          sectionIndex: i,
          totalSections: sections.length,
        }
      )
    );
    const merged = sanitizeItineraryBySourceSections(
      mergeImportedItineraries(parts),
      SCANDINAVIA_TIME_SLOTS,
      SCANDINAVIA_TRIP_SUMMARY
    );
    const totalItems = merged.days.reduce((n, d) => n + (d.items?.length ?? 0), 0);
    const totalSlots = parseScheduleSlotsFromSection(SCANDINAVIA_TIME_SLOTS).length;
    expect(totalItems).toBeLessThanOrEqual(totalSlots + sections.length);
    expect(merged.days.length).toBeGreaterThanOrEqual(2);
  });
});
