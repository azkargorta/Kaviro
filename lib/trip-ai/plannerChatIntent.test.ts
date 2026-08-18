import { describe, expect, it } from "vitest";
import { classifyPlannerChatIntent, plannerChatIntentToRule } from "@/lib/trip-ai/plannerChatIntent";

describe("plannerChatIntent", () => {
  it("detecta rellenar traslados sin tratarlo como plan de noches", () => {
    const intent = classifyPlannerChatIntent(
      "los dias de traslado tambien quiero visitar sitios de camino o hacer excursiones"
    );
    expect(intent.kind).toBe("fill_transfers");
    expect(plannerChatIntentToRule(intent, "")).toMatch(/NO es un día vacío/i);
  });

  it("detecta añadir visitas en días concretos", () => {
    const intent = classifyPlannerChatIntent("el dia 3 y el dia 6 quiero que añadas cosas que ver y excursiones");
    expect(intent.kind).toBe("add_sights");
    expect(intent.dayNums).toEqual(expect.arrayContaining([3, 6]));
  });

  it("detecta quitar una base", () => {
    const intent = classifyPlannerChatIntent("Quita Hiroshima");
    expect(intent.kind).toBe("remove_place");
    expect(intent.place).toBe("Hiroshima");
  });

  it("detecta plan de noches", () => {
    expect(classifyPlannerChatIntent("quiero dormir el 7 en cafayate").kind).toBe("sleep");
  });
});
