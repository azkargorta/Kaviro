import { describe, expect, it } from "vitest";
import {
  buildPlannerFreeText,
  emptyPlannerBrief,
  getPlannerMissingField,
  mergePlannerBrief,
  normalizePlannerBrief,
  plannerDestinationsForGenerate,
} from "@/lib/trip-ai/plannerBrief";

describe("plannerBrief", () => {
  it("pide destino si la ficha está vacía", () => {
    expect(getPlannerMissingField(emptyPlannerBrief())).toBe("destination");
  });

  it("pide bases si el destino es región y no hay dónde dormir", () => {
    const brief = normalizePlannerBrief({
      destination: "Salta y Jujuy",
      destinationKind: "region",
    });
    expect(getPlannerMissingField(brief)).toBe("sleepBases");
  });

  it("no pide bases si es una ciudad concreta", () => {
    const brief = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
    });
    expect(getPlannerMissingField(brief)).toBe(null);
    expect(plannerDestinationsForGenerate(brief)).toEqual(["Lisboa"]);
  });

  it("usa sleepBases para generar", () => {
    const brief = normalizePlannerBrief({
      destination: "NOA",
      destinationKind: "region",
      sleepBases: ["Salta", "Tilcara"],
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
      transport: "driving",
    });
    expect(getPlannerMissingField(brief)).toBe(null);
    expect(plannerDestinationsForGenerate(brief)).toEqual(["Salta", "Tilcara"]);
  });

  it("incluye llegada y salida en las notas del generador", () => {
    const brief = mergePlannerBrief(
      emptyPlannerBrief(),
      normalizePlannerBrief({
        destination: "Lisboa",
        destinationKind: "city",
        transport: "driving",
        arrival: { place: "Aeropuerto de Salta", date: "2026-12-06", time: "20:00" },
        departure: { place: "Aeropuerto de Salta", date: "2026-12-11", time: "20:00" },
      })
    );
    const notes = buildPlannerFreeText(brief);
    expect(notes).toMatch(/primer día es de llegada/i);
    expect(notes).toMatch(/último día/i);
    expect(notes).toMatch(/coche/i);
  });

  it("acepta llegada y salida abiertas", () => {
    const withDates = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
    });
    expect(getPlannerMissingField(withDates)).toBe(null);
  });

  it("pide transporte si hay más de una base", () => {
    const brief = normalizePlannerBrief({
      destination: "NOA",
      destinationKind: "region",
      sleepBases: ["Salta", "Tilcara"],
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
    });
    expect(getPlannerMissingField(brief)).toBe("transport");
  });
});
