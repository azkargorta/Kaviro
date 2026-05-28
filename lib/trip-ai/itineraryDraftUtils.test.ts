import { describe, expect, it } from "vitest";
import {
  collectItineraryItemKeys,
  filterItineraryBySelection,
  looksLikePastedItineraryImport,
} from "@/lib/trip-ai/itineraryDraftUtils";

describe("looksLikePastedItineraryImport", () => {
  it("detecta agendas largas con horas", () => {
    const sample =
      "DÍA 1\n12.00h- Vuelo MADRID-CHICAGO\n15.55h- WELCOME\n18.00h- HOTEL\nDÍA 2\n08.00h LOU MITCHELL";
    expect(looksLikePastedItineraryImport(sample.repeat(8))).toBe(true);
  });

  it("ignora mensajes cortos", () => {
    expect(looksLikePastedItineraryImport("Hola, ¿qué hacer en Chicago?")).toBe(false);
  });
});

describe("filterItineraryBySelection", () => {
  it("filtra items no seleccionados", () => {
    const draft = {
      version: 1 as const,
      days: [
        {
          day: 1,
          date: "2026-10-29",
          items: [
            { title: "A" },
            { title: "B" },
          ],
        },
      ],
    };
    const keys = collectItineraryItemKeys(draft);
    const onlyA = new Set(["d1-i0"]);
    const filtered = filterItineraryBySelection(draft, onlyA);
    expect(filtered.days[0].items).toHaveLength(1);
    expect(filtered.days[0].items[0].title).toBe("A");
    expect(keys.size).toBe(2);
  });
});
