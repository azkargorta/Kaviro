import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logApiEvent } from "@/lib/api-observability";
import {
  checkRateLimit,
  maybeCleanupRateLimitStores,
  rateLimit429Headers,
  type RateLimitPreset,
  type RateLimitPresetId,
} from "@/lib/rate-limit";

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitKeyUserOrIp(request: NextRequest, prefix: string): string {
  const userId = request.cookies.get("sb-user-id")?.value;
  if (userId) return `${prefix}:user:${userId}`;
  return `${prefix}:ip:${clientIp(request)}`;
}

/** GET público de enlace compartido: /api/trip-shares/[token] */
export function isPublicShareApi(pathname: string, method: string): boolean {
  return method === "GET" && /^\/api\/trip-shares\/[^/]+$/.test(pathname);
}

export function resolveRateLimitPreset(pathname: string, method: string): RateLimitPresetId | null {
  if (pathname.startsWith("/api/trip-ai/") || pathname.startsWith("/api/trips/ai-")) {
    return "ai";
  }
  if (
    pathname === "/api/document/analyze" ||
    pathname === "/api/expense/analyze" ||
    pathname === "/api/expense/analyze-text"
  ) {
    return "ocr";
  }
  if (isPublicShareApi(pathname, method)) {
    return "share";
  }
  if (
    pathname.startsWith("/api/geocode") ||
    pathname.startsWith("/api/places/") ||
    pathname.startsWith("/api/osm/") ||
    pathname.startsWith("/api/osrm/")
  ) {
    return "geocode";
  }
  return null;
}

export function buildRateLimitKey(request: NextRequest, presetId: RateLimitPresetId): string {
  const pathname = request.nextUrl.pathname;
  if (presetId === "share") {
    const token = pathname.split("/").pop() || "unknown";
    return `share:token:${token}:ip:${clientIp(request)}`;
  }
  return rateLimitKeyUserOrIp(request, presetId);
}

export type RateLimitMiddlewareResult =
  | { blocked: true; response: NextResponse }
  | { blocked: false; remaining: number; preset: RateLimitPreset };

export function applyRateLimit(request: NextRequest): RateLimitMiddlewareResult | null {
  const presetId = resolveRateLimitPreset(request.nextUrl.pathname, request.method);
  if (!presetId) return null;

  maybeCleanupRateLimitStores();
  const key = buildRateLimitKey(request, presetId);
  const { allowed, remaining, resetIn, preset } = checkRateLimit(presetId, key);

  if (!allowed) {
    logApiEvent("warn", "rate_limit_exceeded", {
      preset: presetId,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: clientIp(request),
    });
    return {
      blocked: true,
      response: NextResponse.json(
        {
          error: preset.message,
          code: "RATE_LIMITED",
          retryAfter: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: rateLimit429Headers(remaining, resetIn, preset),
        }
      ),
    };
  }

  return { blocked: false, remaining, preset };
}
