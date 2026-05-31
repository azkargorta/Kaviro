import { describe, expect, it } from "vitest";
import {
  collectItineraryItemKeys,
  countDaySectionsInSource,
  countItineraryItems,
  estimateMinActivitiesFromSource,
  filterItineraryBySelection,
  isItineraryImportIncomplete,
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

describe("estimateMinActivitiesFromSource", () => {
  it("cuenta bloques horarios sin encabezado DÍA", () => {
    const text = [
      "12.00h- Vuelo MADRID-CHICAGO",
      "15.55h- Llegada",
      "18.00h- Hotel",
      "08.00h- Museo",
      "20.00h- Cena",
    ].join("\n");
    expect(estimateMinActivitiesFromSource(text)).toBeGreaterThanOrEqual(4);
  });
});

describe("countDaySectionsInSource", () => {
  it("cuenta encabezados VIERNES 27 / sábado 5", () => {
    const text = "VIERNES 27\n10.00h Vuelo\nSABADO 28\n12.00h Museo\nDOMINGO 29\n09.00h Tour";
    expect(countDaySectionsInSource(text)).toBe(3);
  });
});

describe("isItineraryImportIncomplete", () => {
  it("detecta borrador con una sola actividad en texto largo", () => {
    const draft = {
      version: 1 as const,
      days: [{ day: 1, date: "2026-10-28", items: [{ title: "Solo una" }] }],
    };
    const long = `${"12.00h- Actividad\n".repeat(12)}DÍA 2\n${"14.00h- Otra\n".repeat(8)}`;
    expect(isItineraryImportIncomplete(draft, long)).toBe(true);
    expect(countItineraryItems(draft)).toBe(1);
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
