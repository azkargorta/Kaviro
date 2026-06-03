import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** Marca como leídas las notificaciones in-app de avisos de este viaje. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const tripId = params.id;
  const gate = await requireTripAccessApi(tripId);
  if (!gate.ok) return gate.response;

  const url = `/trip/${tripId}/announcements`;
  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("user_notifications")
    .update({ read_at: now })
    .eq("user_id", gate.access.userId)
    .eq("type", "trip_announcement")
    .is("read_at", null)
    .eq("url", url);

  if (error && error.code !== "42P01") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await admin
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", gate.access.userId)
    .is("read_at", null);

  return NextResponse.json({ ok: true, unreadCount: count ?? 0 });
}
