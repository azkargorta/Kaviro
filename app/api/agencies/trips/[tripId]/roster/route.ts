import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import {
  BOOKING_STATUS_LABELS,
  isBookingStatus,
  type BookingStatus,
} from "@/lib/agency/booking-status";
import {
  canSetBookingStatus,
  suggestBookingStatusForNewTraveler,
  summarizeCapacity,
} from "@/lib/agency/capacity";
import { normalizePermissions } from "@/lib/participants";

type Params = { params: { tripId: string } };

async function loadTripSettings(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, tripId: string) {
  const { data: trip, error } = await supabase
    .from("trips")
    .select("max_capacity, agency_waitlist_enabled")
    .eq("id", tripId)
    .maybeSingle();
  if (error) throw error;
  return {
    maxCapacity: trip?.max_capacity != null ? Number(trip.max_capacity) : null,
    waitlistEnabled: trip?.agency_waitlist_enabled !== false,
  };
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const settings = await loadTripSettings(gate.supabase, params.tripId);
    const { data, error } = await gate.supabase
      .from("trip_participants")
      .select("id, display_name, email, phone, role, status, booking_status, created_at")
      .eq("trip_id", params.tripId)
      .neq("status", "removed")
      .order("created_at", { ascending: true });

    if (error) {
      if (error.message.includes("booking_status")) {
        return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_capacity.sql" });
      }
      throw error;
    }

    const rows = data ?? [];
    const staff = rows.filter((r) => r.role === "owner" || r.role === "editor");
    const travelers = rows.filter((r) => r.role === "viewer");
    const counts = summarizeCapacity(rows, settings.maxCapacity);

    return NextResponse.json({
      staff,
      travelers,
      counts,
      settings,
      statusLabels: BOOKING_STATUS_LABELS,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al cargar la lista." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
  let bookingStatus = isBookingStatus(body?.bookingStatus) ? body.bookingStatus : null;

  if (!displayName) {
    return NextResponse.json({ error: "Indica el nombre del viajero." }, { status: 400 });
  }

  try {
    const settings = await loadTripSettings(gate.supabase, params.tripId);
    const { data: existing } = await gate.supabase
      .from("trip_participants")
      .select("booking_status, status")
      .eq("trip_id", params.tripId)
      .neq("status", "removed");

    const counts = summarizeCapacity(existing ?? [], settings.maxCapacity);
    if (!bookingStatus) {
      bookingStatus = suggestBookingStatusForNewTraveler(settings, counts);
    } else {
      const check = canSetBookingStatus(settings, counts, bookingStatus, null);
      if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    const permissions = normalizePermissions("viewer", {});
    const { data, error } = await gate.supabase
      .from("trip_participants")
      .insert({
        trip_id: params.tripId,
        display_name: displayName,
        email,
        phone,
        role: "viewer",
        status: "pending",
        joined_via: "manual",
        booking_status: bookingStatus,
        ...permissions,
      })
      .select("id, display_name, email, phone, role, status, booking_status")
      .single();

    if (error) {
      if (error.message.includes("booking_status")) {
        return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_capacity.sql" });
      }
      throw error;
    }

    await logBookingEvent(gate, params.tripId, data.id, null, bookingStatus, "Alta desde panel agencia");

    return NextResponse.json({ participant: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo añadir el viajero." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const participantId = typeof body?.participantId === "string" ? body.participantId : "";
  const bookingStatus = isBookingStatus(body?.bookingStatus) ? body.bookingStatus : null;

  if (!participantId || !bookingStatus) {
    return NextResponse.json({ error: "participantId y bookingStatus son obligatorios." }, { status: 400 });
  }

  try {
    const { data: current, error: curErr } = await gate.supabase
      .from("trip_participants")
      .select("id, trip_id, booking_status, status")
      .eq("id", participantId)
      .eq("trip_id", params.tripId)
      .maybeSingle();

    if (curErr) throw curErr;
    if (!current) return NextResponse.json({ error: "Viajero no encontrado." }, { status: 404 });

    const settings = await loadTripSettings(gate.supabase, params.tripId);
    const { data: all } = await gate.supabase
      .from("trip_participants")
      .select("booking_status, status")
      .eq("trip_id", params.tripId)
      .neq("status", "removed");

    const counts = summarizeCapacity(all ?? [], settings.maxCapacity);
    const check = canSetBookingStatus(
      settings,
      counts,
      bookingStatus,
      current.booking_status as string | null
    );
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 409 });

    const { data, error } = await gate.supabase
      .from("trip_participants")
      .update({ booking_status: bookingStatus, updated_at: new Date().toISOString() })
      .eq("id", participantId)
      .select("id, display_name, email, phone, role, status, booking_status")
      .single();

    if (error) throw error;

    await logBookingEvent(
      gate,
      params.tripId,
      participantId,
      current.booking_status as string | null,
      bookingStatus,
      typeof body?.note === "string" ? body.note : null
    );

    return NextResponse.json({ participant: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar." },
      { status: 500 }
    );
  }
}

async function logBookingEvent(
  gate: Awaited<ReturnType<typeof requireAgencyTripAccess>> & { error?: never },
  tripId: string,
  participantId: string,
  fromStatus: string | null,
  toStatus: BookingStatus,
  note: string | null
) {
  if ("error" in gate) return;
  const { error } = await gate.supabase.from("agency_trip_booking_events").insert({
    agency_id: gate.ctx.agency.id,
    trip_id: tripId,
    participant_id: participantId,
    from_status: fromStatus,
    to_status: toStatus,
    note,
    created_by: gate.user.id,
  });
  if (error && !error.message.includes("agency_trip_booking_events")) {
    logger.warn("booking event log:", error.message);
  }
}
