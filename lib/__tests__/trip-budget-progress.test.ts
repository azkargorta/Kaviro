import { describe, expect, it } from "vitest";
import { getBudgetBarColor, getBudgetProgress } from "@/lib/trip-budget-progress";

describe("getBudgetProgress", () => {
  it("returns ok tone under 80%", () => {
    const r = getBudgetProgress(400, 1000);
    expect(r.pct).toBe(40);
    expect(r.barWidthPct).toBe(40);
    expect(r.tone).toBe("ok");
    expect(r.overBudget).toBe(false);
    expect(r.barColor).toMatch(/^hsl\(/);
  });

  it("returns warning tone above 80%", () => {
    const r = getBudgetProgress(850, 1000);
    expect(r.pct).toBe(85);
    expect(r.tone).toBe("warning");
  });

  it("shows real pct above 100% with full bar", () => {
    const r = getBudgetProgress(1200, 1000);
    expect(r.overBudget).toBe(true);
    expect(r.tone).toBe("over");
    expect(r.pct).toBe(120);
    expect(r.barWidthPct).toBe(100);
    expect(r.barColor).toBe("#dc2626");
  });
});

describe("getBudgetBarColor", () => {
  it("is greenish at low usage", () => {
    expect(getBudgetBarColor(20)).toMatch(/^hsl\((1[0-4][0-9]|[5-9][0-9]),/);
  });

  it("is red at 100% and beyond", () => {
    expect(getBudgetBarColor(100)).toMatch(/^hsl\(0/);
    expect(getBudgetBarColor(150)).toBe("#dc2626");
  });
});
