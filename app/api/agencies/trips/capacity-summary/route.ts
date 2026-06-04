import { NextResponse } from "next/server";
import { requireAgencyApiContext } from "@/lib/require-agency-api";
import { summarizeCapacity } from "@/lib/agency/capacity";

/** Resumen de ocupación para todos los viajes de la agencia (tarjetas en listado). */
export async function GET() {
  const gate = await requireAgencyApiContext();
  if (!gate.ok) return gate.response;

  const { supabase, agency } = gate.ctx;

  const { data: trips, error: tripErr } = await supabase
    .from("trips")
    .select("id, max_capacity")
    .eq("agency_id", agency.id);

  if (tripErr) {
    if (tripErr.message.includes("max_capacity")) {
      return NextResponse.json({ summaries: {}, needsMigration: true });
    }
    return NextResponse.json({ error: tripErr.message }, { status: 500 });
  }

  const tripRows = trips ?? [];
  if (!tripRows.length) return NextResponse.json({ summaries: {} });

  const tripIds = tripRows.map((t) => t.id as string);
  const { data: participants, error: pErr } = await supabase
    .from("trip_participants")
    .select("trip_id, booking_status, status")
    .in("trip_id", tripIds)
    .neq("status", "removed");

  if (pErr) {
    if (pErr.message.includes("booking_status")) {
      return NextResponse.json({ summaries: {}, needsMigration: true });
    }
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const byTrip = new Map<string, Array<{ booking_status?: string | null; status?: string }>>();
  for (const p of participants ?? []) {
    const tid = p.trip_id as string;
    const list = byTrip.get(tid) ?? [];
    list.push(p);
    byTrip.set(tid, list);
  }

  const summaries: Record<
    string,
    { occupied: number; maxCapacity: number | null; isFull: boolean; label: string }
  > = {};

  for (const t of tripRows) {
    const id = t.id as string;
    const maxCapacity = t.max_capacity != null ? Number(t.max_capacity) : null;
    const counts = summarizeCapacity(byTrip.get(id) ?? [], maxCapacity);
    summaries[id] = {
      occupied: counts.occupied,
      maxCapacity,
      isFull: counts.isFull,
      label:
        maxCapacity != null && maxCapacity > 0
          ? `${counts.occupied}/${maxCapacity} plazas`
          : counts.occupied > 0
            ? `${counts.occupied} viajeros`
            : "",
    };
  }

  return NextResponse.json({ summaries });
}
