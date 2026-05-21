import { describe, expect, it } from "vitest";
import {
  activitiesLikelySame,
  dedupeDaysInCityBlock,
  isMultiDayVenue,
  notesAllowMultiDayFor,
} from "./itineraryDedup";

describe("itineraryDedup", () => {
  it("detecta títulos equivalentes", () => {
    expect(activitiesLikelySame("Teatro Colón", "Visita Teatro Colón")).toBe(true);
    expect(activitiesLikelySame("Museo del Prado", "Parque del Retiro")).toBe(false);
  });

  it("elimina repetidos entre días salvo excepción multi-día", () => {
    const days = dedupeDaysInCityBlock(
      [
        {
          day: 1,
          date: "2026-06-01",
          items: [{ title: "Catedral de León", activity_kind: "culture" }],
        },
        {
          day: 2,
          date: "2026-06-02",
          items: [
            { title: "Visita Catedral de León", activity_kind: "culture" },
            { title: "Barrio Húmedo", activity_kind: "neighborhood" },
          ],
        },
      ],
      { notes: "" }
    );
    expect(days[1]?.items).toHaveLength(1);
    expect(days[1]?.items[0]?.title).toBe("Barrio Húmedo");
  });

  it("permite repetir si el usuario lo pidió en notas", () => {
    expect(notesAllowMultiDayFor("Disneyland", "Quiero 2 días en Disneyland")).toBe(true);
    expect(isMultiDayVenue("Parque temático PortAventura", "")).toBe(true);
  });
});
