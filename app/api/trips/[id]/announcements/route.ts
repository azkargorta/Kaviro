import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const tripId = params.id;
  const gate = await requireTripAccessApi(tripId);
  if (!gate.ok) return gate.response;

  const { data: trip } = await gate.supabase
    .from("trips")
    .select("agency_id")
    .eq("id", tripId)
    .maybeSingle();

  const agencyId = (trip as { agency_id?: string | null } | null)?.agency_id ?? null;
  if (!agencyId) {
    return NextResponse.json({ error: "Este viaje no tiene avisos de organizador." }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const [{ data: announcements, error }, { data: agency }] = await Promise.all([
    admin
      .from("agency_trip_announcements")
      .select("id, title, body, created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("agencies").select("name").eq("id", agencyId).maybeSingle(),
  ]);

  if (error) {
    if (error.message.includes("agency_trip_announcements")) {
      return NextResponse.json({ announcements: [], organizerName: null, needsMigration: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const organizerName = (agency as { name?: string } | null)?.name?.trim() || "Organizador del viaje";

  return NextResponse.json({
    announcements: announcements ?? [],
    organizerName,
  });
}
