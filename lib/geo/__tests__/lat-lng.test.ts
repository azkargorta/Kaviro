import { describe, expect, it } from "vitest";
import { isLatLng } from "@/lib/geo/lat-lng";

describe("isLatLng", () => {
  it("acepta coordenadas válidas", () => {
    expect(isLatLng({ lat: 40.4, lng: -3.7 })).toBe(true);
  });

  it("rechaza valores no numéricos o incompletos", () => {
    expect(isLatLng(null)).toBe(false);
    expect(isLatLng({ lat: "40", lng: 1 })).toBe(false);
    expect(isLatLng({ lat: 40 })).toBe(false);
  });
});
