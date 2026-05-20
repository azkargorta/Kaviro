import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  rateLimit429Headers,
} from "@/lib/rate-limit";
import {
  isPublicShareApi,
  resolveRateLimitPreset,
} from "@/lib/rate-limit-middleware";

describe("checkRateLimit", () => {
  it("bloquea tras maxCalls para la misma clave", () => {
    const key = `test:block:${Date.now()}`;
    const preset = RATE_LIMIT_PRESETS.ai;
    let lastAllowed = true;
    for (let i = 0; i <= preset.maxCalls; i++) {
      const r = checkRateLimit("ai", key);
      lastAllowed = r.allowed;
      if (i < preset.maxCalls) expect(r.allowed).toBe(true);
    }
    expect(lastAllowed).toBe(false);
  });

  it("expone cabeceras 429 coherentes", () => {
    const headers = rateLimit429Headers(0, 30_000, RATE_LIMIT_PRESETS.ocr);
    expect(headers["Retry-After"]).toBe("30");
    expect(headers["X-RateLimit-Limit"]).toBe("6");
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
  });
});

describe("resolveRateLimitPreset", () => {
  it("detecta IA, OCR, share y geocode", () => {
    expect(resolveRateLimitPreset("/api/trip-ai/chat", "POST")).toBe("ai");
    expect(resolveRateLimitPreset("/api/trips/ai-brief", "POST")).toBe("ai");
    expect(resolveRateLimitPreset("/api/document/analyze", "POST")).toBe("ocr");
    expect(resolveRateLimitPreset("/api/expense/analyze-text", "POST")).toBe("ocr");
    expect(resolveRateLimitPreset("/api/trip-shares/abc123", "GET")).toBe("share");
    expect(resolveRateLimitPreset("/api/trip-shares", "GET")).toBeNull();
    expect(resolveRateLimitPreset("/api/geocode", "POST")).toBe("geocode");
    expect(resolveRateLimitPreset("/api/osrm/route", "POST")).toBe("geocode");
    expect(resolveRateLimitPreset("/api/places/search", "GET")).toBe("geocode");
  });
});

describe("isPublicShareApi", () => {
  it("solo GET con token en path", () => {
    expect(isPublicShareApi("/api/trip-shares/secret-token", "GET")).toBe(true);
    expect(isPublicShareApi("/api/trip-shares/secret-token/extra", "GET")).toBe(false);
    expect(isPublicShareApi("/api/trip-shares/secret-token", "POST")).toBe(false);
  });
});
