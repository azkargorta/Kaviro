import { describe, expect, it } from "vitest";
import {
  fillItineraryDatesFromTripSummary,
  splitSourceByDaySections,
  splitSourceByTimeSlots,
  splitSourceForImport,
} from "@/lib/trip-ai/importItineraryFromText";

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
});

describe("splitSourceByTimeSlots", () => {
  it("parte agendas sin DÍA N por líneas 12.00h-", () => {
    const lines = Array.from({ length: 8 }, (_, i) => `${10 + i}.00h- Actividad ${i + 1}`);
    const parts = splitSourceByTimeSlots(lines.join("\n"), 3);
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("splitSourceForImport", () => {
  it("prefiere trozos por hora si no hay DÍA", () => {
    const text = Array.from({ length: 10 }, (_, i) => `${9 + i}.30h- Parada ${i}`).join("\n");
    const parts = splitSourceForImport(text);
    expect(parts.length).toBeGreaterThanOrEqual(2);
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
