import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  listPendingInviteeIdsForTrip,
  listTravelMatesForTrip,
  listTravelMatesForUser,
} from "@/lib/travel-mates";

export const runtime = "nodejs";

/** GET — compañeros habituales. Con ?tripId= excluye participantes e incluye invitaciones pendientes. */
export async function GET(request: Request) {
  try {
    const tripId = new URL(request.url).searchParams.get("tripId");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = createSupabaseAdmin();
    if (!tripId) {
      const mates = await listTravelMatesForUser(admin, user.id);
      return NextResponse.json({ mates });
    }

    const [mates, pendingInviteeIds] = await Promise.all([
      listTravelMatesForTrip(admin, user.id, tripId),
      listPendingInviteeIdsForTrip(admin, user.id, tripId),
    ]);
    return NextResponse.json({ mates, pendingInviteeIds });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    if (msg.includes("user_travel_mates") || msg.includes("avatar_kind")) {
      return NextResponse.json(
        {
          error: "Ejecuta docs/kaviro_social_features.sql en Supabase.",
          mates: [],
          pendingInviteeIds: [],
          needsMigration: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
