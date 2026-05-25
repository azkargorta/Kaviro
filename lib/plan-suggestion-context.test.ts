import { describe, expect, it } from "vitest";
import {
  analyzePlanDayGaps,
  buildPlanDayGaps,
  cleanPlanSuggestion,
  extractActivityCity,
  fallbackPlanSuggestionFromGaps,
  listRemainingPlanDayGaps,
  summarizePlanDayNeeds,
} from "./plan-suggestion-context";

describe("cleanPlanSuggestion", () => {
  it("acepta frases imperativas completas", () => {
    expect(cleanPlanSuggestion("Añadir comida entre museo y parque")).toBe("Añadir comida entre museo y parque");
  });

  it("rechaza null y frases incompletas", () => {
    expect(cleanPlanSuggestion("null")).toBeNull();
    expect(cleanPlanSuggestion("Considera añadir")).toBeNull();
    expect(cleanPlanSuggestion("Considera añadir un almuerzo")).toBeNull();
  });
});

const tokyoDayWithoutBreakfast = [
  { title: "Templo Senso-ji", activity_time: "09:30:00", activity_kind: "visit" },
  { title: "Museo Nacional", activity_time: "13:00:00", activity_kind: "museum" },
  { title: "Mercado Ameya-Yokocho", activity_time: "16:30:00", activity_kind: "visit" },
  { title: "Cena en Ueno", activity_time: "19:30:00", activity_kind: "restaurant" },
];

const tokyoDayWithBreakfast = [
  { title: "Desayuno en Asakusa", activity_time: "08:00:00", activity_kind: "restaurant" },
  { title: "Templo Senso-ji", activity_time: "09:30:00", activity_kind: "visit" },
  { title: "Museo Nacional", activity_time: "13:00:00", activity_kind: "museum" },
  { title: "Mercado Ameya-Yokocho", activity_time: "16:30:00", activity_kind: "visit" },
  { title: "Cena en Ueno", activity_time: "19:30:00", activity_kind: "restaurant" },
];

describe("extractActivityCity", () => {
  it("extrae ciudad de direcciones con país", () => {
    expect(
      extractActivityCity({
        title: "Senso-ji",
        address: "Senso-ji Temple, Asakusa, Tokio, Japón",
      })
    ).toBe("tokio");
  });
});

describe("analyzePlanDayGaps", () => {
  it("detecta desayuno faltante si la primera actividad es tarde", () => {
    const gaps = analyzePlanDayGaps(tokyoDayWithoutBreakfast);
    expect(gaps.some((g) => /desayuno/i.test(g))).toBe(true);
  });

  it("detecta comida faltante aunque ya haya desayuno", () => {
    const gaps = buildPlanDayGaps(tokyoDayWithBreakfast);
    expect(gaps.some((gap) => gap.kind === "lunch" || gap.kind === "meal_gap")).toBe(true);
  });

  it("genera fallback de desayuno", () => {
    const suggestion = fallbackPlanSuggestionFromGaps(tokyoDayWithoutBreakfast);
    expect(suggestion).toMatch(/desayuno/i);
  });

  it("pasa a comida cuando el desayuno ya fue sugerido", () => {
    const exclude = ["Añadir desayuno ~08:00 antes de Templo Senso-ji"];
    const remaining = listRemainingPlanDayGaps(tokyoDayWithBreakfast, exclude);
    expect(remaining.some((gap) => gap.kind === "lunch" || gap.kind === "meal_gap")).toBe(true);

    const suggestion = fallbackPlanSuggestionFromGaps(tokyoDayWithBreakfast, exclude);
    expect(suggestion).toMatch(/comida|café/i);
    expect(suggestion).not.toMatch(/desayuno/i);
  });

  it("detecta traslado si cambia de ciudad al inicio del día", () => {
    const gaps = buildPlanDayGaps(
      [{ title: "Fushimi Inari", activity_time: "09:00:00", address: "Fushimi Inari, Kyoto, Japón", activity_kind: "visit" }],
      {
        prevDayActivities: [
          { title: "Senso-ji", activity_time: "18:00:00", address: "Asakusa, Tokio, Japón", activity_kind: "visit" },
        ],
      }
    );
    expect(gaps.some((gap) => gap.kind === "city_transfer")).toBe(true);
    expect(fallbackPlanSuggestionFromGaps(
      [{ title: "Fushimi Inari", activity_time: "09:00:00", address: "Fushimi Inari, Kyoto, Japón", activity_kind: "visit" }],
      [],
      {
        prevDayActivities: [
          { title: "Senso-ji", activity_time: "18:00:00", address: "Asakusa, Tokio, Japón", activity_kind: "visit" },
        ],
      }
    )).toMatch(/traslado/i);
  });

  it("detecta traslado entre actividades de distinta ciudad", () => {
    const gaps = buildPlanDayGaps([
      { title: "Salida hotel", activity_time: "08:00:00", address: "Osaka, Japón", activity_kind: "lodging" },
      { title: "Arashiyama", activity_time: "14:00:00", address: "Arashiyama, Kyoto, Japón", activity_kind: "visit" },
    ]);
    expect(gaps.some((gap) => gap.kind === "city_transfer")).toBe(true);
  });

  it("detecta día ligero con tarde libre", () => {
    const gaps = buildPlanDayGaps([
      { title: "Museo", activity_time: "10:00:00", activity_kind: "museum" },
      { title: "Comida local", activity_time: "13:00:00", activity_kind: "restaurant" },
    ]);
    expect(gaps.some((gap) => gap.kind === "sparse_day" || gap.kind === "free_time")).toBe(true);
    expect(summarizePlanDayNeeds([
      { title: "Museo", activity_time: "10:00:00", activity_kind: "museum" },
      { title: "Comida local", activity_time: "13:00:00", activity_kind: "restaurant" },
    ])).toMatch(/más actividades/i);
  });
});
