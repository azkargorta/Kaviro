import { describe, expect, it } from "vitest";
import {
  busPlatformUrls,
  carPlatformUrls,
  flightPlatformUrls,
  slugPlace,
  trainPlatformUrls,
} from "./trip-search-urls";

const base = {
  origin: "Madrid",
  destination: "Llanes",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  adults: 2,
  tripType: "ida-vuelta" as const,
};

describe("trip-search-urls", () => {
  it("slugifica ciudades", () => {
    expect(slugPlace("San Sebastián")).toBe("san-sebastian");
    expect(slugPlace("Llanes")).toBe("llanes");
  });

  it("genera URLs https sin rutas rotas obvias", () => {
    for (const p of flightPlatformUrls(base)) {
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.url).not.toMatch(/\.htm$/);
    }
    for (const p of trainPlatformUrls(base)) {
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.url).toMatch(/omio|renfe|trainline|blablacar/i);
    }
    for (const p of busPlatformUrls(base)) {
      expect(p.url).toMatch(/^https:\/\//);
    }
  });

  it("incluye datos en enlaces de coche", () => {
    const urls = carPlatformUrls({
      pickup: "Oviedo",
      dropoff: "Llanes",
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      adults: 2,
      luggage: 2,
    });
    expect(urls.length).toBeGreaterThan(3);
    expect(urls.some((u) => u.url.includes("Oviedo") || u.url.includes("oviedo"))).toBe(true);
    expect(urls.some((u) => u.name === "Rentalcars")).toBe(true);
  });
});
