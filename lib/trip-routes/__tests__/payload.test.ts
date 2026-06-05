import { describe, expect, it } from "vitest";
import {
  buildTripRoutePayload,
  buildTripRoutePatchPayload,
  omitPayloadKey,
  routeDisplayTitle,
} from "@/lib/trip-routes/payload";

describe("trip route payload", () => {
  it("normaliza tripId y título alternativos", () => {
    const payload = buildTripRoutePayload({
      trip_id: "t1",
      route_name: "Ruta norte",
      mode: "walking",
    });
    expect(payload.trip_id).toBe("t1");
    expect(payload.title).toBe("Ruta norte");
    expect(payload.travel_mode).toBe("walking");
  });

  it("solo incluye campos presentes en patch", () => {
    const patch = buildTripRoutePatchPayload({ title: "Nueva ruta" });
    expect(patch.title).toBe("Nueva ruta");
    expect(patch.notes).toBeUndefined();
  });

  it("omite claves del payload de fallback", () => {
    expect(omitPayloadKey({ color: "red", title: "A" }, "color")).toEqual({ title: "A" });
  });

  it("resuelve título visible de la ruta", () => {
    expect(routeDisplayTitle({ route_name: "Costa" })).toBe("Costa");
    expect(routeDisplayTitle({})).toBe("Ruta");
  });
});
