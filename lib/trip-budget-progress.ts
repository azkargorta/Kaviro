export type BudgetProgressTone = "brand" | "warning" | "over";

export function getBudgetProgress(spent: number, target: number): {
  pct: number;
  tone: BudgetProgressTone;
  overBudget: boolean;
} {
  const safeTarget = target > 0 ? target : 0;
  const safeSpent = Number.isFinite(spent) && spent >= 0 ? spent : 0;
  if (safeTarget <= 0) {
    return { pct: 0, tone: "brand", overBudget: false };
  }
  const pct = Math.round(Math.min(100, (safeSpent / safeTarget) * 100));
  const overBudget = safeSpent > safeTarget;
  const tone: BudgetProgressTone = overBudget ? "over" : safeSpent > safeTarget * 0.8 ? "warning" : "brand";
  return { pct, tone, overBudget };
}

export const BUDGET_BAR_CLASS: Record<BudgetProgressTone, string> = {
  brand: "bg-[#F87171]",
  warning: "bg-amber-400",
  over: "bg-rose-500",
};
