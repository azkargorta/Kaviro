import { describe, expect, it } from "vitest";
import { classifyTripCalendarStatus, tripOverlapsMonth } from "@/lib/agency/calendar";

describe("classifyTripCalendarStatus", () => {
  it("detects active trip", () => {
    expect(classifyTripCalendarStatus("2026-06-01", "2026-06-30", "2026-06-15")).toBe("active");
  });

  it("detects preparation", () => {
    expect(classifyTripCalendarStatus("2026-07-01", "2026-07-10", "2026-06-15")).toBe("preparation");
  });
});

describe("tripOverlapsMonth", () => {
  it("includes trip spanning month", () => {
    expect(tripOverlapsMonth("2026-05-28", "2026-06-05", 2026, 6)).toBe(true);
  });

  it("excludes trip in other month", () => {
    expect(tripOverlapsMonth("2026-07-01", "2026-07-10", 2026, 6)).toBe(false);
  });
});
