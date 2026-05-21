import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { listTravelMatesForTrip } from "@/lib/travel-mates";

export const runtime = "nodejs";

/** GET ?tripId= — compañeros habituales (viajes compartidos) excluyendo quien ya está en el viaje */
export async function GET(request: Request) {
  try {
    const tripId = new URL(request.url).searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = createSupabaseAdmin();
    const mates = await listTravelMatesForTrip(admin, user.id, tripId);
    return NextResponse.json({ mates });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    if (msg.includes("user_travel_mates") || msg.includes("avatar_kind")) {
      return NextResponse.json(
        { error: "Ejecuta docs/kaviro_social_features.sql en Supabase.", mates: [] },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
