/**
 * Logs estructurados JSON para APIs (compatible con Edge y Node).
 * En Vercel/Datadog se pueden filtrar por `event` y `route`.
 */

import { logger } from "@/lib/logger";

export type ApiLogLevel = "info" | "warn" | "error";

export function logApiEvent(
  level: ApiLogLevel,
  event: string,
  meta: Record<string, string | number | boolean | null | undefined> = {}
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  const line = JSON.stringify(payload);
  if (level === "error") logger.error(line);
  else if (level === "warn") logger.warn(line);
  else logger.info(line);
}
