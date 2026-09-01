import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const OTP_TYPES = ["recovery", "signup", "email"] as const;
type OtpType = (typeof OTP_TYPES)[number];

function isOtpType(s: string): s is OtpType {
  return (OTP_TYPES as readonly string[]).includes(s);
}

/**
 * Validación sin PKCE vía token_hash en el correo.
 * - recovery → /auth/reset-password
 * - signup | email → entra directamente a Kaviro con la sesión creada
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const code = requestUrl.searchParams.get("code");
  const typeRaw = requestUrl.searchParams.get("type");
  const nextRaw = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!token_hash && code) {
    const safeNext =
      nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";
    const u = new URL("/auth/callback", requestUrl.origin);
    u.searchParams.set("code", code);
    if (typeRaw) u.searchParams.set("type", typeRaw);
    u.searchParams.set("next", safeNext);
    return NextResponse.redirect(u);
  }

  if (!token_hash || !typeRaw || !isOtpType(typeRaw)) {
    const u = new URL("/auth/confirmed", requestUrl.origin);
    u.searchParams.set("status", "error");
    u.searchParams.set(
      "message",
      "El enlace de confirmación está incompleto o ya no es válido. Solicita un correo nuevo e inténtalo otra vez."
    );
    return NextResponse.redirect(u);
  }

  const safeNext =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  const successUrl = (() => {
    if (typeRaw === "recovery") return new URL("/auth/reset-password", requestUrl.origin);
    const u = new URL(safeNext, requestUrl.origin);
    if (safeNext === "/dashboard") u.searchParams.set("welcome", "1");
    return u;
  })();

  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    type: typeRaw,
    token_hash,
  });

  if (error) {
    const u = new URL("/auth/confirmed", requestUrl.origin);
    u.searchParams.set("status", "error");
    u.searchParams.set("message", error.message);
    u.searchParams.set("next", safeNext);
    return NextResponse.redirect(u);
  }

  return response;
}
