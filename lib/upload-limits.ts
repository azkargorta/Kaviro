/** Límites de tamaño para subidas (auditoría seguridad / coste IA). */
export const TRIP_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const EXPENSE_RECEIPT_MAX_BYTES = 8 * 1024 * 1024;
export const AI_DOCUMENT_ANALYZE_MAX_BYTES = TRIP_DOCUMENT_MAX_BYTES;

export function uploadTooLargeMessage(maxBytes: number): string {
  const mb = Math.round(maxBytes / (1024 * 1024));
  return `El archivo supera el máximo de ${mb} MB.`;
}

export function assertFileWithinLimit(file: File, maxBytes: number): string | null {
  if (file.size > maxBytes) return uploadTooLargeMessage(maxBytes);
  return null;
}

export function assertBytesWithinLimit(size: number | null | undefined, maxBytes: number): string | null {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return null;
  if (size > maxBytes) return uploadTooLargeMessage(maxBytes);
  return null;
}
