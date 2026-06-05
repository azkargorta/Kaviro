import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAgencyPanelPath, isProtectedAgencyApiPath } from "@/lib/agency-access";
import {
  agencyHasWorkspaceAccess,
  isAgencyBillingOnlyPath,
  isAgencyWorkspacePath,
} from "@/lib/agency-plan-access";
import { getAgencyForUser } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { isPlatformOpsPath } from "@/lib/platform-ops-paths";
import { applyRateLimit } from "@/lib/rate-limit-middleware";
import { TRAVELER_PREVIEW_COOKIE } from "@/lib/trip-traveler-preview";
import { updateSession } from "@/lib/supabase/middleware";

/** Activa o desactiva la previsualización Kaviro viajero para staff de agencia. */
function travelerPreviewMiddleware(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  const tripMatch = pathname.match(/^\/trip\/([^/]+)/);
  if (!tripMatch) return null;
  const tripId = tripMatch[1];

  if (searchParams.get("exitTravelerPreview") === "1") {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("exitTravelerPreview");
    const res = NextResponse.redirect(clean);
    res.cookies.delete(TRAVELER_PREVIEW_COOKIE);
    return res;
  }

  if (searchParams.get("asTraveler") === "1") {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("asTraveler");
    const res = NextResponse.redirect(clean);
    res.cookies.set(TRAVELER_PREVIEW_COOKIE, tripId, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    return res;
  }

  return null;
}

/** Evita getUser() en Supabase antes de login/signup (doble llamada y más latencia). */
function skipsSessionRefresh(pathname: string): boolean {
  return pathname === "/api/auth/login" || pathname === "/api/auth/signup";
}

export async function middleware(request: NextRequest) {
  const previewRedirect = travelerPreviewMiddleware(request);
  if (previewRedirect) return previewRedirect;

  const rateLimit = applyRateLimit(request);
  if (rateLimit?.blocked) return rateLimit.response;

  let response = skipsSessionRefresh(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const needsPlatformAdmin = isPlatformOpsPath(pathname);
  const needsAgencyMembership = isAgencyPanelPath(pathname) || isProtectedAgencyApiPath(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((needsPlatformAdmin || needsAgencyMembership) && supabaseUrl && supabaseAnonKey) {
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

    if (needsPlatformAdmin) {
      if (!user) {
        const login = new URL("/auth/login", request.url);
        login.searchParams.set("next", pathname);
        return NextResponse.redirect(login);
      }
      const admin = await isPlatformAdmin(user.id, user.email);
      if (!admin) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Sin permisos de administrador de plataforma." },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    if (needsAgencyMembership) {
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
        return NextResponse.redirect(new URL("/agency/setup", request.url));
      }

      const planInactive = !agencyHasWorkspaceAccess(ctx.agency);
      if (planInactive) {
        if (pathname.startsWith("/api/")) {
          if (isAgencyBillingOnlyPath(pathname)) {
            // APIs de facturación siguen disponibles
          } else if (isProtectedAgencyApiPath(pathname)) {
            return NextResponse.json(
              { error: "Plan inactivo. Actualiza tu suscripción.", code: "PLAN_INACTIVE" },
              { status: 402 }
            );
          }
        } else if (isAgencyWorkspacePath(pathname)) {
          const planUrl = new URL("/agency/plan", request.url);
          planUrl.searchParams.set("reason", "plan-inactive");
          return NextResponse.redirect(planUrl);
        }
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
