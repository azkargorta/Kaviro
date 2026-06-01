import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit-middleware";
import { updateSession } from "@/lib/supabase/middleware";

/** Evita getUser() en Supabase antes de login/signup (doble llamada y más latencia). */
function skipsSessionRefresh(pathname: string): boolean {
  return pathname === "/api/auth/login" || pathname === "/api/auth/signup";
}

export async function middleware(request: NextRequest) {
  const rateLimit = applyRateLimit(request);
  if (rateLimit?.blocked) return rateLimit.response;

  const response = skipsSessionRefresh(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : await updateSession(request);

  if (rateLimit && !rateLimit.blocked) {
    response.headers.set("X-RateLimit-Limit", String(rateLimit.preset.maxCalls));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|offline.html|google[a-z0-9]+\\.html).*)",
  ],
};
