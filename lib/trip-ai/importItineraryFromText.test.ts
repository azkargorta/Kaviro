import { describe, expect, it } from "vitest";
import {
  alignItineraryDatesForImport,
  alignItemsToSectionSchedule,
  countScheduleLinesInText,
  fillItineraryDatesFromTripSummary,
  looksLikeAgencyWeekdayCalendar,
  mergeImportedItineraries,
  normalizeChunkImportResult,
  parseAgencyCalendarItinerary,
  parseDayOfMonthFromCalendarHeader,
  parseScheduleSlotsFromSection,
  resolveDayOfMonthInTripRange,
  sanitizeItineraryBySourceSections,
  splitSourceByDaySections,
  splitSourceByTimeSlots,
  splitSourceForImport,
  stampItineraryDatesFromChunkLabel,
} from "@/lib/trip-ai/importItineraryFromText";
import {
  ARGENTINA_STRIPES_CALENDAR,
  ARGENTINA_TRIP_SUMMARY,
} from "@/lib/trip-ai/argentinaStripesFixture";
import { ARGENTINA_OFFICIAL_PDF_SNIPPET } from "@/lib/trip-ai/argentinaOfficialPdfFixture";
import {
  isAgencyCalendarParseAcceptable,
  normalizeAgencyCalendarSourceText,
} from "@/lib/trip-ai/agencyCalendarParse";
import { countItineraryItems } from "@/lib/trip-ai/itineraryDraftUtils";

const ARGENTINA_SAMPLE = [
  "CALENDARIO TRIP TO ARGENTINA 2026",
  "VIERNES 27",
  "16.00h QUEDADA GRUPAL en T1 BARAJAS",
  "19.05h Vuelo MADRID-BUENOS AIRES",
  "SABADO 28",
  "04.15h Aterrizaje en BUENOS AIRES",
  "07.30h Desayuno en Hotel",
  "DOMINGO 29",
  "08.30h EXCURSION GUIADA BUENOS AIRES SUR",
  "LUNES 30",
  "08.30h EXCURSION GUIADA BUENOS AIRES NORTE",
  "MARTES 1",
  "11.00h Vuelo BUENOS AIRES-USHUAIA",
  "MIERCOLES 2",
  "09.15h EXCURSION PARQUE NACIONAL TIERRA DEL FUEGO",
  "JUEVES 3",
  "11.20h Vuelo USHUAIA - EL CALAFATE",
  "VIERNES 4",
  "09.15h EXCURSION GLACIAR PERITO MORENO",
  "SABADO 5",
  "14.30h Vuelo EL CALAFATE - BUENOS AIRES - IGUAZU",
  "DOMINGO 6",
  "09.15h EXCURSION CATARATAS IGUAZU ZONA ARGENTINA",
  "LUNES 7",
  "18.55h Vuelo IGUAZU-BUENOS AIRES-MADRID",
  "MARTES 8",
  "16.15h LLEGADA A T1, RECOGER MALETAS",
].join("\n");

describe("parseAgencyCalendarItinerary", () => {
  it("detecta calendario Stripes y genera 12 días sin inflar paradas", () => {
    expect(looksLikeAgencyWeekdayCalendar(ARGENTINA_STRIPES_CALENDAR)).toBe(true);
    const parsed = parseAgencyCalendarItinerary(ARGENTINA_STRIPES_CALENDAR, ARGENTINA_TRIP_SUMMARY);
    expect(parsed).toBeTruthy();
    expect(parsed!.days).toHaveLength(12);
    expect(countItineraryItems(parsed!)).toBe(countScheduleLinesInText(ARGENTINA_STRIPES_CALENDAR));

    const day7 = parsed!.days.find((d) => d.date === "2026-12-07");
    expect(day7?.items).toHaveLength(5);
    expect(day7?.items?.map((it) => it.start_time)).toEqual([
      "08:00",
      "11:30",
      "16:00",
      "16:30",
      "18:55",
    ]);
    expect(day7?.items?.some((it) => /calafate|imago/i.test(it.title))).toBe(false);
  });

  it("prioriza el calendario resumen del PDF oficial (12 días, sin amontonar en día 1)", () => {
    const normalized = normalizeAgencyCalendarSourceText(ARGENTINA_OFFICIAL_PDF_SNIPPET);
    expect(looksLikeAgencyWeekdayCalendar(normalized)).toBe(true);
    const parsed = parseAgencyCalendarItinerary(normalized, ARGENTINA_TRIP_SUMMARY);
    expect(parsed).toBeTruthy();
    expect(isAgencyCalendarParseAcceptable(parsed!, normalized, ARGENTINA_TRIP_SUMMARY)).toBe(true);
    expect(parsed!.days).toHaveLength(12);
    expect(parsed!.days[0]?.date).toBe("2026-11-27");
    expect(parsed!.days[0]?.items?.length).toBeLessThanOrEqual(6);
    expect(parsed!.days.find((d) => d.date === "2026-12-07")?.items).toHaveLength(5);
  });
});

describe("splitSourceByDaySections", () => {
  it("devuelve un solo bloque si no hay encabezados DÍA", () => {
    const parts = splitSourceByDaySections("Llegada al hotel a las 15:00");
    expect(parts).toHaveLength(1);
    expect(parts[0]?.header).toBe("Todo");
  });

  it("parte por DÍA con número", () => {
    const text = [
      "DÍA 29 — Llegada",
      "10:00 Vuelo",
      "",
      "DÍA 30 — Museos",
      "09:00 Art Institute",
    ].join("\n");
    const parts = splitSourceByDaySections(text);
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]?.body).toMatch(/DÍA\s+29/i);
    expect(parts[1]?.body).toMatch(/DÍA\s+30/i);
  });

  it("parte por encabezados de día de la semana (dossier de agencia)", () => {
    const parts = splitSourceByDaySections(ARGENTINA_SAMPLE);
    expect(parts.length).toBe(12);
    expect(parts[0]?.header).toMatch(/VIERNES\s+27/i);
    expect(parts[11]?.header).toMatch(/MARTES\s+8/i);
  });
});

describe("splitSourceForImport", () => {
  it("prefiere un trozo por día de la semana antes que por horas", () => {
    const parts = splitSourceForImport(ARGENTINA_SAMPLE);
    expect(parts.length).toBe(12);
    expect(parts[0]?.body).toMatch(/VIERNES\s+27/i);
  });

  it("prefiere trozos por hora si no hay DÍA ni weekday", () => {
    const text = Array.from({ length: 10 }, (_, i) => `${9 + i}.30h- Parada ${i}`).join("\n");
    const parts = splitSourceForImport(text);
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("splitSourceByTimeSlots", () => {
  it("parte agendas sin DÍA N por líneas 12.00h-", () => {
    const lines = Array.from({ length: 8 }, (_, i) => `${10 + i}.00h- Actividad ${i + 1}`);
    const parts = splitSourceByTimeSlots(lines.join("\n"), 3);
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("mergeImportedItineraries", () => {
  it("fusiona días duplicados con la misma fecha", () => {
    const merged = mergeImportedItineraries([
      {
        version: 1,
        days: [
          {
            day: 1,
            date: "2026-05-27",
            items: [{ title: "Vuelo", start_time: "19:05" }],
          },
        ],
      },
      {
        version: 1,
        days: [
          {
            day: 1,
            date: "2026-05-27",
            items: [{ title: "Quedada", start_time: "16:00" }],
          },
        ],
      },
    ]);
    expect(merged.days).toHaveLength(1);
    expect(merged.days[0]?.items).toHaveLength(2);
  });
});

describe("fillItineraryDatesFromTripSummary", () => {
  it("asigna fechas secuenciales desde el resumen del viaje", () => {
    const summary =
      "Viaje: Chicago | Destino: Chicago | Fechas: 2026-10-28 → 2026-11-05 | Moneda: USD";
    const filled = fillItineraryDatesFromTripSummary(
      {
        version: 1,
        days: [
          { day: 1, date: null, items: [{ title: "Vuelo" }] },
          { day: 2, date: null, items: [{ title: "Museo" }] },
        ],
      },
      summary
    );
    expect(filled.days[0]?.date).toBe("2026-10-28");
    expect(filled.days[1]?.date).toBe("2026-10-29");
  });
});

describe("parseScheduleSlotsFromSection", () => {
  it("extrae horarios del dossier Argentina (LUNES 7 = 5 actividades)", () => {
    const section = splitSourceForImport(ARGENTINA_STRIPES_CALENDAR).find((s) =>
      /LUNES\s+7/i.test(s.header)
    );
    expect(section).toBeTruthy();
    const slots = parseScheduleSlotsFromSection(section!.body);
    expect(slots).toHaveLength(5);
    expect(slots.map((s) => s.time)).toEqual(["08:00", "11:30", "16:00", "16:30", "18:55"]);
  });
});

describe("alignItemsToSectionSchedule", () => {
  it("descarta actividades de otros días en LUNES 30 aunque compartan hora", () => {
    const section = splitSourceForImport(ARGENTINA_STRIPES_CALENDAR).find((s) =>
      /LUNES\s+30/i.test(s.header)
    )!;
    const polluted = [
      { title: "Quedada T1 Barajas", start_time: "16:00" },
      { title: "Vuelo Madrid-Buenos Aires", start_time: "19:05" },
      { title: "Desayuno en Hotel", start_time: "07:30" },
      { title: "Excursión Buenos Aires Sur", start_time: "08:30" },
      { title: "Desayuno en Hotel", start_time: "07:30" },
      { title: "Excursión Buenos Aires Norte", start_time: "08:30" },
      { title: "Tarde libre", start_time: "17:30" },
      { title: "Posible partido fútbol", start_time: "20:00" },
    ];
    const aligned = alignItemsToSectionSchedule(polluted, section.body);
    expect(aligned).toHaveLength(4);
    expect(aligned.some((it) => /barajas|madrid|sur/i.test(it.title))).toBe(false);
    expect(aligned.some((it) => /norte/i.test(it.title))).toBe(true);
  });

  it("reduce LUNES 7 hinchado a exactamente 5 actividades del dossier", () => {
    const section = splitSourceForImport(ARGENTINA_STRIPES_CALENDAR).find((s) =>
      /LUNES\s+7/i.test(s.header)
    )!;
    const bloated = Array.from({ length: 22 }, (_, i) => ({
      title: i % 2 === 0 ? `El Calafate traslado ${i}` : `Iguazú extra ${i}`,
      start_time: `${8 + (i % 10)}:${i % 2 === 0 ? "00" : "30"}`,
    }));
    bloated.push(
      { title: "Desayuno en hotel", start_time: "08:00" },
      { title: "Cataratas Brasil", start_time: "11:30" },
      { title: "Quedada bus aeropuerto", start_time: "16:00" },
      { title: "Facturación aeropuerto", start_time: "16:30" },
      { title: "Vuelo Iguazú-Madrid", start_time: "18:55" }
    );
    const aligned = alignItemsToSectionSchedule(bloated, section.body);
    expect(aligned).toHaveLength(5);
    expect(aligned.map((it) => it.start_time)).toEqual(["08:00", "11:30", "16:00", "16:30", "18:55"]);
    expect(aligned.some((it) => /calafate/i.test(it.title))).toBe(false);
  });
});

describe("resolveDayOfMonthInTripRange", () => {
  const summary = ARGENTINA_TRIP_SUMMARY;

  it("resuelve VIERNES 27 al inicio del viaje", () => {
    expect(parseDayOfMonthFromCalendarHeader("VIERNES 27")).toBe(27);
    expect(resolveDayOfMonthInTripRange(27, "2026-11-27", "2026-12-08")).toBe("2026-11-27");
  });

  it("resuelve MARTES 1 al mes siguiente dentro del rango", () => {
    expect(parseDayOfMonthFromCalendarHeader("MARTES 1")).toBe(1);
    expect(resolveDayOfMonthInTripRange(1, "2026-11-27", "2026-12-08")).toBe("2026-12-01");
  });

  it("ignora fechas erróneas de la IA y alinea por encabezados del dossier", () => {
    const aligned = alignItineraryDatesForImport(
      {
        version: 1,
        days: [
          { day: 1, date: "2026-11-30", items: [{ title: "Barajas" }] },
          { day: 2, date: "2026-12-01", items: [{ title: "Buenos Aires" }] },
        ],
      },
      summary,
      ARGENTINA_SAMPLE
    );
    expect(aligned.days[0]?.date).toBe("2026-11-27");
    expect(aligned.days[1]?.date).toBe("2026-11-28");
  });

  it("asigna fecha desde la etiqueta del tramo (VIERNES 27)", () => {
    const stamped = stampItineraryDatesFromChunkLabel(
      {
        version: 1,
        days: [{ day: 1, date: "2026-11-30", items: [{ title: "Barajas" }] }],
      },
      "VIERNES 27",
      summary
    );
    expect(stamped.days[0]?.date).toBe("2026-11-27");
  });

  it("colapsa varios days[] de la IA en un solo día acotado al trozo", () => {
    const lunes7Body = [
      "LUNES 7",
      "08.00h Desayuno en hotel",
      "11.30h EXCURSION CATARATAS ZONA BRASILENA",
      "16.00h QUEDADA PARA BUS AL AIRPORT",
      "16.30h LLEGADA A AIRPORT",
      "18.55h Vuelo IGUAZU-MADRID",
    ].join("\n");
    const normalized = normalizeChunkImportResult(
      {
        version: 1,
        days: [
          { day: 1, date: null, items: [{ title: "Desayuno", start_time: "08:00" }] },
          {
            day: 2,
            date: null,
            items: [
              { title: "Quedada hall hotel El Calafate", start_time: "11:30" },
              { title: "Vuelo", start_time: "18:55" },
            ],
          },
          ...Array.from({ length: 20 }, (_, i) => ({
            day: i + 3,
            date: null as string | null,
            items: [{ title: `Extra ${i}`, start_time: "10:00" }],
          })),
        ],
      },
      "LUNES 7",
      lunes7Body,
      summary
    );
    expect(normalized.days).toHaveLength(1);
    expect(normalized.days[0]?.date).toBe("2026-12-07");
    expect(normalized.days[0]?.items).toHaveLength(5);
    expect(normalized.days[0]?.items?.some((it) => /calafate/i.test(it.title))).toBe(false);
  });

  it("recorta un día hinchado tras fusionar importaciones duplicadas", () => {
    const bloated = {
      version: 1,
      days: [
        {
          day: 11,
          date: "2026-12-07",
          items: Array.from({ length: 22 }, (_, i) => ({
            title: `Actividad ${i}`,
            start_time: `${8 + (i % 10)}:00`,
          })),
        },
      ],
    };
    const sanitized = sanitizeItineraryBySourceSections(
      bloated,
      ARGENTINA_STRIPES_CALENDAR,
      summary
    );
    const day7 = sanitized.days.find((d) => d.date === "2026-12-07");
    expect(day7?.items).toHaveLength(5);
    expect(day7?.items?.map((it) => it.start_time)).toEqual([
      "08:00",
      "11:30",
      "16:00",
      "16:30",
      "18:55",
    ]);
  });
});
