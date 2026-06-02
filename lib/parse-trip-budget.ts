/** Normaliza `budget_target` de Supabase (number, string numérica, null). */
export function parseTripBudgetTarget(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}
