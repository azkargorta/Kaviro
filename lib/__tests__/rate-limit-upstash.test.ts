import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { resolveRateLimitPreset } from "@/lib/rate-limit-middleware";
import { checkRateLimitUpstash } from "@/lib/rate-limit-upstash";

describe("resolveRateLimitPreset auth", () => {
  it("limita login y signup por IP", () => {
    expect(resolveRateLimitPreset("/api/auth/login", "POST")).toBe("auth");
    expect(resolveRateLimitPreset("/api/auth/signup", "POST")).toBe("auth");
    expect(resolveRateLimitPreset("/api/auth/login", "GET")).toBeNull();
  });
});

describe("checkRateLimitUpstash", () => {
  const origUrl = process.env.UPSTASH_REDIS_REST_URL;
  const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ result: 1 }, { result: -1 }],
      }))
    );
  });

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = origUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
    vi.unstubAllGlobals();
  });

  it("permite la primera petición y fija expiración", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 1 }, { result: -1 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 1 }],
      } as Response);

    const r = await checkRateLimitUpstash("auth", "ip:1.2.3.4");
    expect(r?.allowed).toBe(true);
    expect(r?.remaining).toBe(RATE_LIMIT_PRESETS.auth.maxCalls - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("bloquea cuando el contador supera el máximo", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { result: RATE_LIMIT_PRESETS.auth.maxCalls + 1 },
        { result: 60_000 },
      ],
    } as Response);

    const r = await checkRateLimitUpstash("auth", "ip:1.2.3.4");
    expect(r?.allowed).toBe(false);
    expect(r?.remaining).toBe(0);
  });
});
