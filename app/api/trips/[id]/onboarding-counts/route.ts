import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { fetchTripOnboardingCounts } from "@/lib/trip-onboarding";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: tripId } = await context.params;
  const access = await requireTripAccessApi(tripId);
  if (!access.ok) return access.response;

  const counts = await fetchTripOnboardingCounts(access.supabase, tripId);
  return NextResponse.json({ counts });
}
