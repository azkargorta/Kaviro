import { describe, expect, it } from "vitest";
import {
  mergeImportedItineraries,
  normalizeChunkImportResult,
  parseScheduleSlotsFromSection,
  sanitizeItineraryBySourceSections,
  splitSourceForImport,
} from "@/lib/trip-ai/importItineraryFromText";
import {
  ARGENTINA_STRIPES_CALENDAR,
  ARGENTINA_TRIP_SUMMARY,
} from "@/lib/trip-ai/argentinaStripesFixture";

describe("último día del import por tramos", () => {
  const summary = ARGENTINA_TRIP_SUMMARY;
  const sections = splitSourceForImport(ARGENTINA_STRIPES_CALENDAR, summary).filter(
    (s) => s.header !== "Todo"
  );
  const lastSection = sections[sections.length - 1]!;
  const lastIndex = sections.length - 1;

  it("cada tramo del calendario Stripes tiene solo sus horarios", () => {
    const slotCounts = sections.map((s) => parseScheduleSlotsFromSection(s.body).length);
    expect(slotCounts[slotCounts.length - 1]).toBe(1);
    expect(slotCounts.reduce((a, b) => a + b, 0)).toBeGreaterThan(15);
  });

  const allTripPollution = sections.flatMap((s) =>
    (s.body.match(/\d{1,2}[.:]\d{2}\s*h/gi) ?? []).map((_, i) => ({
      title: `Actividad copiada ${i}`,
      start_time: "10:00",
    }))
  );

  it("MARTES 8: un solo day[] con todas las actividades del viaje → 1 parada", () => {
    expect(lastSection.header).toMatch(/MARTES\s+8/i);
    const normalized = normalizeChunkImportResult(
      {
        version: 1,
        days: [
          {
            day: 1,
            date: null,
            items: [
              ...allTripPollution,
              { title: "LLEGADA T1", start_time: "16:15" },
            ],
          },
        ],
      },
      lastSection.header,
      lastSection.body,
      summary,
      {
        sourceText: ARGENTINA_STRIPES_CALENDAR,
        sectionIndex: lastIndex,
        totalSections: sections.length,
      }
    );
    expect(normalized.days[0]?.date).toBe("2026-12-08");
    expect(normalized.days[0]?.items).toHaveLength(1);
    expect(normalized.days[0]?.items?.[0]?.start_time).toBe("16:15");
  });

  it("MARTES 8: la IA devuelve todos los days[] en el último tramo → 1 parada", () => {
    const normalized = normalizeChunkImportResult(
      {
        version: 1,
        days: sections.map((s, i) => ({
          day: i + 1,
          date: null,
          items: [{ title: `Día ${i}`, start_time: "08:00" }],
        })),
      },
      lastSection.header,
      lastSection.body,
      summary,
      {
        sourceText: ARGENTINA_STRIPES_CALENDAR,
        sectionIndex: lastIndex,
        totalSections: sections.length,
      }
    );
    expect(normalized.days[0]?.items).toHaveLength(1);
    expect(normalized.days[0]?.items?.[0]?.start_time).toBe("16:15");
  });

  it("cuerpo del último tramo con calendario completo repetido → 1 parada", () => {
    const pollutedBody = `${lastSection.body}\n${ARGENTINA_STRIPES_CALENDAR}`;
    const normalized = normalizeChunkImportResult(
      {
        version: 1,
        days: [{ day: 1, date: null, items: allTripPollution }],
      },
      lastSection.header,
      pollutedBody,
      summary,
      {
        sourceText: ARGENTINA_STRIPES_CALENDAR,
        sectionIndex: lastIndex,
        totalSections: sections.length,
      }
    );
    expect(normalized.days[0]?.items).toHaveLength(1);
    expect(normalized.days[0]?.items?.[0]?.start_time).toBe("16:15");
  });

  it("sin normalize: sanitize recorta día 8 hinchado tras merge", () => {
    const mergedRaw = mergeImportedItineraries([
      ...sections.slice(0, -1).map((section, i) =>
        normalizeChunkImportResult(
          {
            version: 1,
            days: [{ day: 1, date: null, items: [{ title: section.header, start_time: "08:00" }] }],
          },
          section.header,
          section.body,
          summary,
          {
            sourceText: ARGENTINA_STRIPES_CALENDAR,
            sectionIndex: i,
            totalSections: sections.length,
          }
        )
      ),
      {
        version: 1,
        days: [
          {
            day: 1,
            date: "2026-12-08",
            items: allTripPollution,
          },
        ],
      },
    ]);
    const sanitized = sanitizeItineraryBySourceSections(
      mergedRaw,
      ARGENTINA_STRIPES_CALENDAR,
      summary
    );
    const day8 = sanitized.days.find((d) => d.date === "2026-12-08");
    expect(day8?.items?.length).toBeLessThanOrEqual(2);
  });

  it("fusión: último tramo hinchado no contamina el día 8 tras sanitize", () => {
    const goodParts = sections.slice(0, -1).map((section, i) =>
      normalizeChunkImportResult(
        {
          version: 1,
          days: [{ day: 1, date: null, items: [{ title: section.header, start_time: "08:00" }] }],
        },
        section.header,
        section.body,
        summary,
        {
          sourceText: ARGENTINA_STRIPES_CALENDAR,
          sectionIndex: i,
          totalSections: sections.length,
        }
      )
    );
    const bloatedLast = normalizeChunkImportResult(
      {
        version: 1,
        days: [{ day: 1, date: "2026-12-08", items: allTripPollution }],
      },
      lastSection.header,
      lastSection.body,
      summary,
      {
        sourceText: ARGENTINA_STRIPES_CALENDAR,
        sectionIndex: lastIndex,
        totalSections: sections.length,
      }
    );
    const merged = sanitizeItineraryBySourceSections(
      mergeImportedItineraries([...goodParts, bloatedLast]),
      ARGENTINA_STRIPES_CALENDAR,
      summary
    );
    const day8 = merged.days.find((d) => d.date === "2026-12-08");
    expect(day8?.items?.length).toBeLessThanOrEqual(2);
    expect(day8?.items?.[0]?.start_time).toBe("16:15");
  });
});
