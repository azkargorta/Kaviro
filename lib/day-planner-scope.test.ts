import { describe, expect, it } from "vitest";
import { applyMealsOnlyPlanFilter, detectMealsOnlyDayPlannerRequest } from "@/lib/day-planner-scope";

describe("day-planner-scope", () => {
  it("detecta petición solo de comidas cerca de visitas", () => {
    expect(
      detectMealsOnlyDayPlannerRequest(
        "para el 28 de diciembre un sitio para cenar y comer cerca de los lugares que visito, italiano y hamburguesa"
      )
    ).toBe(true);
    expect(detectMealsOnlyDayPlannerRequest("organiza el día 28 completo en coche de 9 a 21")).toBe(false);
  });

  it("filtra a máximo 3 restaurantes sin desplazamientos", () => {
    const filtered = applyMealsOnlyPlanFilter({
      date: "2026-12-28",
      travelMode: "transit",
      items: [
        { title: "Desayuno en el hotel", kind: "restaurant" },
        { title: "Desplazamiento a Battery Park", kind: "visit" },
        { title: "Comida italiana cerca de Liberty Island", kind: "restaurant" },
        { title: "Cena hamburguesas Brooklyn", kind: "restaurant" },
      ],
    });
    expect(filtered.items).toHaveLength(2);
    expect(filtered.items.every((i) => i.kind === "restaurant")).toBe(true);
    expect(filtered.items.some((i) => /desplazamiento/i.test(i.title))).toBe(false);
  });
});
