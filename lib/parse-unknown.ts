/** Helpers para leer JSON/IA sin `as any`. */

export function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readBoolean(value: unknown): boolean {
  return Boolean(value);
}
