import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit-middleware";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const rateLimit = applyRateLimit(request);
  if (rateLimit?.blocked) return rateLimit.response;

  const response = await updateSession(request);

  if (rateLimit && !rateLimit.blocked) {
    response.headers.set("X-RateLimit-Limit", String(rateLimit.preset.maxCalls));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|offline.html).*)",
  ],
};
