import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { loadPublicRecapStats } from "@/lib/public-trip-recap-stats";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLE = "trip_shares";

export async function GET(_request: Request, context: { params: { token: string } }) {
  try {
    const token = context.params.token;
    if (!token) return NextResponse.json({ error: "Falta token" }, { status: 400 });

    const supabase = getServiceRoleClient();

    type ShareRow = {
      trip_id: string;
      revoked_at: string | null;
      expires_at: string | null;
      share_kind?: string | null;
    };

    const primary = await supabase
      .from(TABLE)
      .select("token, trip_id, revoked_at, expires_at, created_at, share_kind")
      .eq("token", token)
      .maybeSingle();

    let share: ShareRow | null = primary.data;
    let shareErr = primary.error;

    if (shareErr?.message?.includes("share_kind")) {
      const fallback = await supabase
        .from(TABLE)
        .select("token, trip_id, revoked_at, expires_at, created_at")
        .eq("token", token)
        .maybeSingle();
      share = fallback.data;
      shareErr = fallback.error;
    }

    if (shareErr) throw new Error(shareErr.message);
    if (!share) return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 });
    if (share.revoked_at) return NextResponse.json({ error: "Enlace revocado" }, { status: 410 });
    if (share.expires_at && new Date(String(share.expires_at)).getTime() < Date.now()) {
      return NextResponse.json({ error: "Enlace caducado" }, { status: 410 });
    }

    const kind = share.share_kind;
    if (kind && kind !== "recap") {
      return NextResponse.json({ error: "Este enlace no es de recap." }, { status: 400 });
    }

    const tripId = String(share.trip_id);
    const { data: trip } = await supabase
      .from("trips")
      .select("id, name, destination, start_date, end_date, base_currency")
      .eq("id", tripId)
      .maybeSingle();

    if (!trip) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });

    const stats = await loadPublicRecapStats(
      supabase,
      tripId,
      typeof trip.base_currency === "string" ? trip.base_currency : "EUR"
    );

    return NextResponse.json({ share, trip, stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el recap." },
      { status: 500 }
    );
  }
}
