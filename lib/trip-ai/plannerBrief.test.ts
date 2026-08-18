import { describe, expect, it } from "vitest";
import {
  applyPlannerFieldSkip,
  buildPlannerFreeText,
  emptyPlannerBrief,
  getPlannerMissingField,
  isPlannerSkipPhrase,
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

  it("no pide bases si es una ciudad concreta, pero sí compañía", () => {
    const brief = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
    });
    expect(getPlannerMissingField(brief)).toBe("travelers");
    expect(plannerDestinationsForGenerate(brief)).toEqual(["Lisboa"]);
  });

  it("usa sleepBases para generar y sigue pidiendo el perfil del viaje", () => {
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
    expect(getPlannerMissingField(brief)).toBe("travelers");
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

  it("acepta llegada y salida abiertas y pasa a preguntar compañía", () => {
    const withDates = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
    });
    expect(getPlannerMissingField(withDates)).toBe("travelers");
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

  it("pide estilo y ritmo después de la compañía", () => {
    const brief = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
      travelersType: "couple",
    });
    expect(getPlannerMissingField(brief)).toBe("style");
    const withStyle = mergePlannerBrief(brief, normalizePlannerBrief({ interests: ["naturaleza"] }));
    expect(getPlannerMissingField(withStyle)).toBe("pace");
  });

  it("queda listo si se saltan compañía, estilo y ritmo", () => {
    const brief = normalizePlannerBrief({
      destination: "Lisboa",
      destinationKind: "city",
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalSkipped: true,
      departureSkipped: true,
      travelersSkipped: true,
      styleSkipped: true,
      paceSkipped: true,
    });
    expect(getPlannerMissingField(brief)).toBe(null);
  });

  it("marca ritmo equilibrado al saltar el ritmo", () => {
    const patch = applyPlannerFieldSkip("pace");
    expect(patch?.paceSkipped).toBe(true);
    expect(patch?.pace).toBe("balanced");
    expect(isPlannerSkipPhrase("tú decide")).toBe(true);
  });
});
