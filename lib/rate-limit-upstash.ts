import {
  RATE_LIMIT_PRESETS,
  type RateLimitPreset,
  type RateLimitPresetId,
} from "@/lib/rate-limit";
import { upstashSafePipeline } from "@/lib/upstash-redis";

export type RateLimitCheckResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  preset: RateLimitPreset;
};

function redisKey(presetId: RateLimitPresetId, key: string): string {
  return `kaviro:rl:${presetId}:${key}`;
}

/** Ventana fija con INCR + PTTL (compartido entre instancias Vercel). */
export async function checkRateLimitUpstash(
  presetId: RateLimitPresetId,
  key: string
): Promise<RateLimitCheckResult | null> {
  const preset = RATE_LIMIT_PRESETS[presetId];
  const rk = redisKey(presetId, key);

  let pipeline = await upstashSafePipeline([
    ["INCR", rk],
    ["PTTL", rk],
  ]);
  if (!pipeline) return null;

  const countRaw = pipeline[0]?.result;
  const pttlRaw = pipeline[1]?.result;
  const count = typeof countRaw === "number" ? countRaw : Number(countRaw);
  let pttl = typeof pttlRaw === "number" ? pttlRaw : Number(pttlRaw);

  if (!Number.isFinite(count) || count < 1) return null;

  if (pttl < 0) {
    await upstashSafePipeline([["PEXPIRE", rk, preset.windowMs]]);
    pttl = preset.windowMs;
  }

  const resetIn = Number.isFinite(pttl) && pttl >= 0 ? pttl : preset.windowMs;

  if (count > preset.maxCalls) {
    return { allowed: false, remaining: 0, resetIn, preset };
  }

  return {
    allowed: true,
    remaining: Math.max(0, preset.maxCalls - count),
    resetIn,
    preset,
  };
}
