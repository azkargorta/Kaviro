export type BudgetProgressTone = "ok" | "warning" | "over";

export type BudgetProgress = {
  /** Porcentaje real (puede superar 100). */
  pct: number;
  /** Ancho de la barra en el track (máx. 100). */
  barWidthPct: number;
  /** Color de la barra (verde → rojo según gasto). */
  barColor: string;
  tone: BudgetProgressTone;
  overBudget: boolean;
};

/** Interpola verde (0 %) → rojo (100 %+). */
export function getBudgetBarColor(percent: number): string {
  const p = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  if (p > 100) return "#dc2626";
  const t = Math.min(1, p / 100);
  const hue = 142 * (1 - t);
  const saturation = 58 + t * 12;
  const lightness = 46 - t * 10;
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

export function getBudgetProgress(spent: number, target: number): BudgetProgress {
  const safeTarget = target > 0 ? target : 0;
  const safeSpent = Number.isFinite(spent) && spent >= 0 ? spent : 0;
  if (safeTarget <= 0) {
    return {
      pct: 0,
      barWidthPct: 0,
      barColor: getBudgetBarColor(0),
      tone: "ok",
      overBudget: false,
    };
  }

  const rawPct = (safeSpent / safeTarget) * 100;
  const pct = Math.round(rawPct);
  const barWidthPct = Math.min(100, rawPct);
  const barColor = getBudgetBarColor(rawPct);
  const overBudget = safeSpent > safeTarget;
  const tone: BudgetProgressTone = overBudget ? "over" : rawPct > 80 ? "warning" : "ok";

  return { pct, barWidthPct, barColor, tone, overBudget };
}

/** @deprecated Usar `barColor` de `getBudgetProgress`. */
export const BUDGET_BAR_CLASS: Record<BudgetProgressTone, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-400",
  over: "bg-rose-600",
};
