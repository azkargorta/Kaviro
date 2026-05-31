import { describe, expect, it } from "vitest";
import {
  alignItineraryDatesForImport,
  fillItineraryDatesFromTripSummary,
  mergeImportedItineraries,
  parseDayOfMonthFromCalendarHeader,
  resolveDayOfMonthInTripRange,
  splitSourceByDaySections,
  splitSourceByTimeSlots,
  splitSourceForImport,
  stampItineraryDatesFromChunkLabel,
} from "@/lib/trip-ai/importItineraryFromText";

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

describe("resolveDayOfMonthInTripRange", () => {
  const summary =
    "Viaje: Argentina | Destino: Argentina | Fechas: 2026-11-27 → 2026-12-08 | Moneda: EUR";

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
});
