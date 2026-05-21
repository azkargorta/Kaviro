import { describe, expect, it } from "vitest";
import { consolidateRestaurantsForDay, isNamedRestaurantItem } from "./restaurantPlans";
import type { PlannerPreferences } from "./plannerPreferences";

const basePrefs: PlannerPreferences = {
  nearbyExcursions: "maybe",
  mixStylesWhenTime: true,
  tripStyle: null,
  suggestRestaurants: true,
  restaurantBudget: "medium",
};

describe("restaurantPlans", () => {
  it("detecta restaurantes por título", () => {
    expect(isNamedRestaurantItem({ title: "Restaurante La Parrilla", activity_kind: "gastro_experience" })).toBe(
      true
    );
    expect(isNamedRestaurantItem({ title: "Mercado de Abastos", activity_kind: "gastro_experience" })).toBe(false);
  });

  it("deja solo un restaurante por comida", () => {
    const items = consolidateRestaurantsForDay(
      [
        { title: "Playa de Toró", activity_kind: "nature", activity_time: "10:00", latitude: 43.42, longitude: -4.75 },
        {
          title: "Restaurante A",
          activity_kind: "gastro_experience",
          activity_time: "13:00",
          latitude: 43.42,
          longitude: -4.75,
        },
        {
          title: "Restaurante B",
          activity_kind: "gastro_experience",
          activity_time: "15:30",
          latitude: 43.43,
          longitude: -4.76,
        },
      ],
      { prefs: basePrefs, city: "Llanes", date: "2026-06-01", gastroPool: [] }
    );
    const rests = items.filter((it) => isNamedRestaurantItem(it));
    expect(rests).toHaveLength(1);
    expect(rests[0]?.activity_time).toMatch(/13:00|15:30/);
  });

  it("elimina restaurantes si el usuario no los quiere", () => {
    const items = consolidateRestaurantsForDay(
      [{ title: "Sidrería X", activity_kind: "gastro_experience", activity_time: "20:00" }],
      {
        prefs: { ...basePrefs, suggestRestaurants: false },
        city: "Llanes",
        date: "2026-06-01",
      }
    );
    expect(items.filter((it) => isNamedRestaurantItem(it))).toHaveLength(0);
  });
});
