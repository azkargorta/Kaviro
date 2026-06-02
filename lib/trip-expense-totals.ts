export type ExpenseAmountRow = {
  amount: unknown;
  currency: string | null;
  exchange_rate_to_base?: number | null;
};

export type ExpenseTotalsResult = {
  totalInBase: number;
  /** Hay divisas distintas a la base que no se pudieron convertir */
  hasUnconvertedForeign: boolean;
  byCurrency: Map<string, number>;
};

/** Suma gastos en moneda base usando tipo de cambio guardado cuando existe. */
export function computeExpenseTotalsInBase(
  rows: ExpenseAmountRow[],
  baseCurrency: string
): ExpenseTotalsResult {
  const bc = (baseCurrency || "EUR").toUpperCase();
  const byCurrency = new Map<string, number>();
  let totalInBase = 0;
  let hasUnconvertedForeign = false;

  for (const r of rows) {
    const n = Number(r.amount);
    if (!Number.isFinite(n)) continue;
    const cur = (typeof r.currency === "string" && r.currency.trim() ? r.currency : bc).toUpperCase();
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + n);

    if (cur === bc) {
      totalInBase += n;
      continue;
    }

    const rate = Number(r.exchange_rate_to_base);
    if (Number.isFinite(rate) && rate > 0) {
      totalInBase += n * rate;
    } else {
      hasUnconvertedForeign = true;
    }
  }

  return { totalInBase, hasUnconvertedForeign, byCurrency };
}
