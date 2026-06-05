import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { notifyTripAnnouncement } from "@/lib/server/notify-trip-announcement";

export const runtime = "nodejs";

type Params = { params: { tripId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data, error } = await gate.supabase
    .from("agency_trip_announcements")
    .select("id, title, body, created_at")
    .eq("trip_id", params.tripId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    if (error.message.includes("agency_trip_announcements")) {
      return NextResponse.json({ announcements: [], needsMigration: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  if (!title || !text) {
    return NextResponse.json({ error: "Título y mensaje son obligatorios." }, { status: 400 });
  }

  const { data, error } = await gate.supabase
    .from("agency_trip_announcements")
    .insert({
      trip_id: params.tripId,
      agency_id: gate.ctx.agency.id,
      title,
      body: text,
      created_by: gate.user.id,
    })
    .select("id, title, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const organizerLabel = gate.ctx.agency.name?.trim() || "Tu organizador";
  void notifyTripAnnouncement({
    tripId: params.tripId,
    actorUserId: gate.user.id,
    title,
    organizerLabel,
  }).catch((e) => logger.warn("notifyTripAnnouncement:", e));

  return NextResponse.json({ announcement: data }, { status: 201 });
}
