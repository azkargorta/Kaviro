import { describe, expect, it } from "vitest";
import {
  allocateNightsOnRoute,
  buildStayRoute,
  matchStopByHint,
  planStaysToMinimizeDriving,
} from "@/lib/trip-ai/plannerStayRoute";

const SALTA = { label: "Salta", center: { lat: -24.7859, lng: -65.4117 } };
const CAFAYATE = { label: "Cafayate", center: { lat: -26.0731, lng: -65.9761 } };
const TILCARA = { label: "Tilcara", center: { lat: -23.5767, lng: -65.3934 } };

describe("plannerStayRoute", () => {
  it("ancla llegada/salida en Salta aunque el usuario liste Cafayate primero", () => {
    const route = buildStayRoute([CAFAYATE, TILCARA, SALTA], {
      startHint: "Aeropuerto de Salta",
      endHint: "Aeropuerto de Salta",
    });
    expect(route[0]?.label).toBe("Salta");
    expect(route[route.length - 1]?.label).toBe("Salta");
    expect(route.some((s) => s.label === "Cafayate")).toBe(true);
    expect(route.some((s) => s.label === "Tilcara")).toBe(true);
  });

  it("reparte 6 días en hub → radios → hub, sin noche puente de 1 día", () => {
    const stays = planStaysToMinimizeDriving([SALTA, CAFAYATE, TILCARA], 6, {
      startHint: "Aeropuerto de Salta",
      endHint: "aeropuerto de salta",
    });
    expect(stays[0]?.stop).toBe("Salta");
    expect(stays[stays.length - 1]?.stop).toBe("Salta");
    expect(stays.reduce((n, s) => n + s.nights, 0)).toBe(6);
    expect(stays.some((s) => s.stop === "Cafayate")).toBe(true);
    expect(stays.some((s) => s.stop === "Tilcara")).toBe(true);
    const middleHubNights = stays.filter((s, i) => s.stop === "Salta" && i > 0 && i < stays.length - 1);
    expect(middleHubNights).toEqual([]);
    expect(stays.find((s) => s.stop === "Cafayate")?.nights).toBeGreaterThanOrEqual(2);
    expect(stays.find((s) => s.stop === "Tilcara")?.nights).toBeGreaterThanOrEqual(2);
  });

  it("ruta lineal A→B→C si salida es C", () => {
    const a = { label: "A", center: { lat: 0, lng: 0 } };
    const b = { label: "B", center: { lat: 0, lng: 1 } };
    const c = { label: "C", center: { lat: 0, lng: 2 } };
    const route = buildStayRoute([c, a, b], { startHint: "A", endHint: "C" });
    expect(route.map((s) => s.label)).toEqual(["A", "B", "C"]);
  });

  it("matchStopByHint encuentra Salta en el aeropuerto", () => {
    expect(matchStopByHint([SALTA, CAFAYATE], "Aeropuerto de Salta")?.label).toBe("Salta");
  });

  it("un solo destino usa todos los días ahí", () => {
    expect(allocateNightsOnRoute([SALTA], 5)).toEqual([
      { stop: "Salta", nights: 5, reason: "5 días para explorar a fondo" },
    ]);
  });
});
