import { describe, expect, it } from "vitest";
import { AiBudgetExceededError, resolveAiBudgetGateError } from "@/lib/ai-budget";

describe("resolveAiBudgetGateError", () => {
  it("mapea AiBudgetExceededError a 402", () => {
    const budget = { monthKey: "2026-06", monthlyBudgetEur: 5, currentEstimatedEur: 5.1 };
    const err = new AiBudgetExceededError("Límite alcanzado", budget);
    const gate = resolveAiBudgetGateError(err);
    expect(gate.status).toBe(402);
    expect(gate.body.code).toBe("AI_BUDGET_EXCEEDED");
    expect(gate.body.budget).toEqual(budget);
  });

  it("devuelve 401 para errores genéricos", () => {
    const gate = resolveAiBudgetGateError(new Error("No hay sesión"));
    expect(gate.status).toBe(401);
    expect(gate.body.error).toBe("No hay sesión");
  });
});
