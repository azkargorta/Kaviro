import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";

/** Viaje de la agencia del usuario autenticado. */
export async function requireAgencyTripAccess(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  }

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) {
    return { error: NextResponse.json({ error: "Sin agencia." }, { status: 403 }) };
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, agency_id, client_portal_slug, name")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    return { error: NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 }) };
  }

  if (trip.agency_id !== ctx.agency.id) {
    return { error: NextResponse.json({ error: "Sin permiso." }, { status: 403 }) };
  }

  return { supabase, user, ctx, trip };
}
