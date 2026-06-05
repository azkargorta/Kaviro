/** Operaciones de diff que el asistente puede aplicar en `/api/trip-ai/apply-diff`. */
export type TripAiDiffOperation = {
  op: string;
  id?: string;
  patch?: Record<string, unknown>;
  fields?: Record<string, unknown>;
};

export type TripAiDiffPayload = {
  version: 1;
  title?: string;
  operations: TripAiDiffOperation[];
};

export function diffOpName(op: unknown): string {
  if (!op || typeof op !== "object" || !("op" in op)) return "";
  const name = (op as { op: unknown }).op;
  return typeof name === "string" ? name : "";
}

export function diffNeedsMapPermission(operations: TripAiDiffOperation[]): boolean {
  return operations.some((op) => {
    const name = diffOpName(op);
    return name === "create_route" || name === "update_route";
  });
}
