import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureDemoTripForUser,
  markDemoOnboardingCompleted,
  markDemoOnboardingSkipped,
  readDemoOnboardingProfile,
  resetDemoTripForUser,
  shouldRedirectToDemoTour,
} from "@/lib/onboarding/createDemoTrip";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const ensured = await ensureDemoTripForUser(user);
    const profile = (await readDemoOnboardingProfile(user.id)) ?? ensured.profile;

    return NextResponse.json({
      tripId: ensured.tripId,
      shouldStartTour: shouldRedirectToDemoTour(profile),
      skipped: Boolean(profile.demo_onboarding_skipped_at),
      completed: Boolean(profile.demo_onboarding_completed_at),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar el onboarding demo." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "skip") {
      await markDemoOnboardingSkipped(user.id);
      return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    }

    if (action === "complete") {
      await markDemoOnboardingCompleted(user.id);
      return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    }

    if (action === "reset") {
      const { tripId } = await resetDemoTripForUser(user);
      return NextResponse.json({ ok: true, tripId, redirectTo: `/trip/${tripId}/summary?tutorial=demo` });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar el onboarding." },
      { status: 500 }
    );
  }
}
