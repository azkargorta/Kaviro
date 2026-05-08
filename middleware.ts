import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── Rate limiting — sliding window in-memory (Edge runtime) ──────────────────
// Max 12 AI calls per minute per user (identified by cookie or IP)
const AI_RATE_MAP = new Map<string, { count: number; resetAt: number }>();
const AI_MAX_CALLS = 12;
const AI_WINDOW_MS = 60_000; // 1 minuto

function getRateLimitKey(request: NextRequest): string {
  // Prefer user cookie over IP for accuracy
  const userId = request.cookies.get("sb-user-id")?.value;
  if (userId) return `ai:${userId}`;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `ai:ip:${ip}`;
}

function checkAiRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = AI_RATE_MAP.get(key);

  if (!entry || now >= entry.resetAt) {
    AI_RATE_MAP.set(key, { count: 1, resetAt: now + AI_WINDOW_MS });
    return { allowed: true, remaining: AI_MAX_CALLS - 1, resetIn: AI_WINDOW_MS };
  }

  if (entry.count >= AI_MAX_CALLS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: AI_MAX_CALLS - entry.count, resetIn: entry.resetAt - now };
}

// Cleanup old entries periodically (every ~5 min)
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, entry] of AI_RATE_MAP) {
    if (now >= entry.resetAt) AI_RATE_MAP.delete(key);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limit to AI endpoints
  if (pathname.startsWith("/api/trip-ai/") || pathname.startsWith("/api/trips/ai-")) {
    maybeCleanup();
    const key = getRateLimitKey(request);
    const { allowed, remaining, resetIn } = checkAiRateLimit(key);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Demasiadas peticiones al asistente. Espera un momento antes de continuar.",
          retryAfter: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Limit": String(AI_MAX_CALLS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil((Date.now() + resetIn) / 1000)),
          },
        }
      );
    }

    // Attach remaining count to request for downstream use
    const response = await updateSession(request);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|offline.html).*)",
  ],
};
