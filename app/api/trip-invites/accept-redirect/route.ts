import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptTripInviteForUser } from "@/lib/server/accept-trip-invite";

export const runtime = "nodejs";

function loginRedirect(request: Request, token: string) {
  const origin = new URL(request.url).origin;
  const next = `/api/trip-invites/accept-redirect?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(next)}`, origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard?inviteError=missing", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return loginRedirect(request, token);
  }

  const result = await acceptTripInviteForUser(token, user);

  if ("error" in result) {
    const params = new URLSearchParams({ inviteError: result.error });
    return NextResponse.redirect(new URL(`/dashboard?${params}`, request.url));
  }

  return NextResponse.redirect(new URL(`/trip/${result.tripId}/summary`, request.url));
}
