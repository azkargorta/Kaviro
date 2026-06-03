import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAgencyPanelPath, isProtectedAgencyApiPath } from "@/lib/agency-access";
import { getAgencyForUser } from "@/lib/agency";
import { applyRateLimit } from "@/lib/rate-limit-middleware";
import { updateSession } from "@/lib/supabase/middleware";

/** Evita getUser() en Supabase antes de login/signup (doble llamada y más latencia). */
function skipsSessionRefresh(pathname: string): boolean {
  return pathname === "/api/auth/login" || pathname === "/api/auth/signup";
}

export async function middleware(request: NextRequest) {
  const rateLimit = applyRateLimit(request);
  if (rateLimit?.blocked) return rateLimit.response;

  let response = skipsSessionRefresh(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const needsAgencyMembership = isAgencyPanelPath(pathname) || isProtectedAgencyApiPath(pathname);

  if (needsAgencyMembership) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const login = new URL("/auth/login", request.url);
        login.searchParams.set("mode", "agency");
        login.searchParams.set("next", pathname);
        return NextResponse.redirect(login);
      }

      const ctx = await getAgencyForUser(supabase, user.id);
      if (!ctx) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "No tienes acceso a Kaviro Trips." },
            { status: 403 }
          );
        }
        const denied = new URL("/empresa", request.url);
        denied.searchParams.set("reason", "no-membership");
        return NextResponse.redirect(denied);
      }
    }
  }

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
