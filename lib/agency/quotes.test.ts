import { describe, expect, it } from "vitest";
import { computeQuoteTotals, isQuoteExpired } from "@/lib/agency/quotes";

describe("computeQuoteTotals", () => {
  it("applies discount and per-person price", () => {
    const r = computeQuoteTotals({
      lines: [{ unit_amount: 1000, quantity: 1 }, { unit_amount: 500, quantity: 2 }],
      travelersCount: 10,
      discountPercent: 10,
    });
    expect(r.subtotal).toBe(2000);
    expect(r.discountAmount).toBe(200);
    expect(r.total).toBe(1800);
    expect(r.pricePerPerson).toBe(180);
  });
});

describe("isQuoteExpired", () => {
  it("detects past valid_until", () => {
    expect(isQuoteExpired("2020-01-01")).toBe(true);
  });
});
