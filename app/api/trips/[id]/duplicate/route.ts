import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { duplicateTripForUser } from "@/lib/trips/duplicateTrip";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const customName: string | undefined =
      typeof body?.name === "string" && body.name.trim() ? body.name.trim() : undefined;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (customName) {
      const { data: nameConflict } = await supabase
        .from("trip_participants")
        .select("trip_id, trips!inner(name)")
        .eq("user_id", user.id)
        .neq("status", "removed")
        .ilike("trips.name", customName)
        .limit(1)
        .maybeSingle();

      if (nameConflict) {
        return NextResponse.json(
          { error: `Ya tienes un viaje llamado "${customName}". Elige un nombre diferente.` },
          { status: 409 }
        );
      }
    }

    const result = await duplicateTripForUser(supabase, user, tripId, {
      customName,
      resetDates: true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, tripId: result.tripId });
  } catch (err) {
    logger.error("Duplicate trip error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo duplicar el viaje." },
      { status: 500 }
    );
  }
}
