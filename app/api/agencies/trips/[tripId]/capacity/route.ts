import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { summarizeCapacity } from "@/lib/agency/capacity";

type Params = { params: { tripId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: trip, error: tripErr } = await gate.supabase
    .from("trips")
    .select("id, name, max_capacity, agency_waitlist_enabled")
    .eq("id", params.tripId)
    .maybeSingle();

  if (tripErr) {
    if (tripErr.message.includes("max_capacity")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_capacity.sql" });
    }
    return NextResponse.json({ error: tripErr.message }, { status: 500 });
  }

  const { data: participants, error: pErr } = await gate.supabase
    .from("trip_participants")
    .select("id, booking_status, status")
    .eq("trip_id", params.tripId)
    .neq("status", "removed");

  if (pErr) {
    if (pErr.message.includes("booking_status")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_capacity.sql" });
    }
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const maxCapacity =
    trip && "max_capacity" in trip && trip.max_capacity != null ? Number(trip.max_capacity) : null;
  const waitlistEnabled =
    trip && "agency_waitlist_enabled" in trip
      ? Boolean(trip.agency_waitlist_enabled)
      : true;

  const counts = summarizeCapacity(participants ?? [], maxCapacity);

  return NextResponse.json({
    tripId: params.tripId,
    tripName: trip?.name ?? "",
    maxCapacity,
    waitlistEnabled,
    counts,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body?.maxCapacity !== undefined) {
    const raw = body.maxCapacity;
    if (raw === null || raw === "") {
      patch.max_capacity = null;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1 || n > 999) {
        return NextResponse.json({ error: "Plazas máximas no válidas (1-999)." }, { status: 400 });
      }
      patch.max_capacity = Math.round(n);
    }
  }

  if (typeof body?.waitlistEnabled === "boolean") {
    patch.agency_waitlist_enabled = body.waitlistEnabled;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { error } = await gate.supabase.from("trips").update(patch).eq("id", params.tripId);
  if (error) {
    if (error.message.includes("max_capacity")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_capacity.sql" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return GET(_req, { params });
}
