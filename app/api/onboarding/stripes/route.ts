import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createStripesTripForUser,
  getStripesTripSummaryForUser,
} from "@/lib/onboarding/createStripesTrip";
import { checkTripLimit } from "@/lib/tier";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const summary = await getStripesTripSummaryForUser(user.id);
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar el viaje Stripes." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const existing = await getStripesTripSummaryForUser(user.id);
    if (existing.hasTrip && existing.tripId) {
      return NextResponse.json({
        ok: true,
        tripId: existing.tripId,
        created: false,
        redirectTo: `/trip/${existing.tripId}/summary`,
      });
    }

    const limitCheck = await checkTripLimit(supabase, user.id);
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 });
    }

    const result = await createStripesTripForUser(user);
    return NextResponse.json({
      ok: true,
      tripId: result.tripId,
      created: result.created,
      redirectTo: `/trip/${result.tripId}/summary`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear el viaje Stripes." },
      { status: 500 }
    );
  }
}
