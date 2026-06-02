import { describe, expect, it } from "vitest";
import { getBudgetProgress, BUDGET_BAR_CLASS } from "@/lib/trip-budget-progress";

describe("getBudgetProgress", () => {
  it("returns brand tone under 80%", () => {
    const r = getBudgetProgress(400, 1000);
    expect(r.pct).toBe(40);
    expect(r.tone).toBe("brand");
    expect(r.overBudget).toBe(false);
    expect(BUDGET_BAR_CLASS[r.tone]).toBe("bg-[#F87171]");
  });

  it("returns warning tone above 80%", () => {
    const r = getBudgetProgress(850, 1000);
    expect(r.pct).toBe(85);
    expect(r.tone).toBe("warning");
  });

  it("returns over tone when spent exceeds target", () => {
    const r = getBudgetProgress(1200, 1000);
    expect(r.overBudget).toBe(true);
    expect(r.tone).toBe("over");
    expect(r.pct).toBe(100);
  });
});
