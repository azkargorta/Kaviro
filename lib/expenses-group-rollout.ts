/**
 * Despliegue gradual del modo «Grupo de gastos».
 *
 * NEXT_PUBLIC_EXPENSES_GROUP_MODE:
 * - off     → oculto (solo viajes normales)
 * - teaser  → enlace secundario en crear viaje (por defecto)
 * - create  → selector Viaje / Grupo visible al crear
 * - full    → igual que create (reservado para ampliar marketing)
 */
export type ExpensesGroupRolloutPhase = "off" | "teaser" | "create" | "full";

const ORDER: ExpensesGroupRolloutPhase[] = ["off", "teaser", "create", "full"];

function parsePhase(raw: string | undefined): ExpensesGroupRolloutPhase {
  const v = (raw ?? "teaser").trim().toLowerCase();
  if (v === "off" || v === "0" || v === "false" || v === "hidden") return "off";
  if (v === "teaser" || v === "hint" || v === "link") return "teaser";
  if (v === "create" || v === "on" || v === "1" || v === "true") return "create";
  if (v === "full") return "full";
  return "teaser";
}

export function getExpensesGroupRolloutPhase(): ExpensesGroupRolloutPhase {
  return parsePhase(process.env.NEXT_PUBLIC_EXPENSES_GROUP_MODE);
}

export function expensesGroupRolloutAtLeast(
  phase: ExpensesGroupRolloutPhase,
  min: ExpensesGroupRolloutPhase
): boolean {
  return ORDER.indexOf(phase) >= ORDER.indexOf(min);
}

export function canShowExpensesGroupCreation(phase = getExpensesGroupRolloutPhase()): boolean {
  return expensesGroupRolloutAtLeast(phase, "teaser");
}

export function canCreateExpensesGroupTrip(phase = getExpensesGroupRolloutPhase()): boolean {
  return expensesGroupRolloutAtLeast(phase, "teaser");
}

export function isMissingColumnError(message: string, column: string): boolean {
  const m = message.toLowerCase();
  const col = column.toLowerCase();
  return (
    m.includes(col) &&
    (m.includes("schema cache") ||
      m.includes("could not find") ||
      m.includes("does not exist") ||
      m.includes("42703"))
  );
}

export const EXPENSES_GROUP_MIGRATION_FILE = "kaviro_trip_mode.sql";
