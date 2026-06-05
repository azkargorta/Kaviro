import { logger } from "@/lib/logger";

type UpstashResult = { result: unknown; error?: string };

function restConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isUpstashRedisConfigured(): boolean {
  return restConfig() !== null;
}

/** Ejecuta un pipeline REST de Upstash (varios comandos en una sola petición). */
export async function upstashPipeline(commands: unknown[][]): Promise<UpstashResult[]> {
  const cfg = restConfig();
  if (!cfg) throw new Error("Upstash no configurado");

  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upstash HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as UpstashResult[];
  if (!Array.isArray(data)) {
    throw new Error("Respuesta Upstash inválida");
  }
  return data;
}

export async function upstashSafePipeline(commands: unknown[][]): Promise<UpstashResult[] | null> {
  try {
    return await upstashPipeline(commands);
  } catch (err) {
    logger.warn("Upstash pipeline error:", err);
    return null;
  }
}
