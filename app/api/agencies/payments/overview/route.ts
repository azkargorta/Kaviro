import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import {
  PAYMENT_OVERALL_LABELS,
  formatMoney,
  summarizeParticipantPayment,
  tripPaymentsSummary,
} from "@/lib/agency/payments";

export const runtime = "nodejs";

function isMigration(msg: string) {
  return msg.includes("agency_participant_payments") || msg.includes("agency_price_per_person");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

  const { data: trips, error: tErr } = await supabase
    .from("trips")
    .select("id, name, start_date, agency_payment_currency, agency_price_per_person")
    .eq("agency_id", ctx.agency.id)
    .order("start_date", { ascending: false });

  if (tErr && isMigration(tErr.message)) {
    return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_payments.sql" });
  }
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const tripIds = (trips ?? []).map((t) => t.id as string);
  if (!tripIds.length) {
    return NextResponse.json({
      totals: { collected: 0, pending: 0, counts: { pending: 0, deposit_paid: 0, paid: 0, cancelled: 0 } },
      trips: [],
      travelers: [],
    });
  }

  const { data: payments, error: pErr } = await supabase
    .from("agency_participant_payments")
    .select(
      "trip_id, participant_id, deposit_amount, final_amount, deposit_status, final_status, deposit_due_at, final_due_at"
    )
    .in("trip_id", tripIds);

  if (pErr && isMigration(pErr.message)) {
    return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_payments.sql" });
  }
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("id, trip_id, display_name, email")
    .in("trip_id", tripIds)
    .eq("role", "viewer")
    .neq("status", "removed");

  const tripById = new Map((trips ?? []).map((t) => [t.id as string, t]));
  const payRows = payments ?? [];

  const globalTotals = tripPaymentsSummary(
    payRows.map((p) => ({
      deposit_status: p.deposit_status,
      final_status: p.final_status,
      deposit_amount: p.deposit_amount,
      final_amount: p.final_amount,
    }))
  );

  const tripSummaries = tripIds.map((tripId) => {
    const trip = tripById.get(tripId);
    const tripPays = payRows.filter((p) => p.trip_id === tripId);
    const totals = tripPaymentsSummary(tripPays);
    const currency = (trip?.agency_payment_currency as string) || "EUR";
    return {
      tripId,
      tripName: (trip?.name as string) || "Viaje",
      startDate: trip?.start_date ?? null,
      currency,
      pricePerPerson: trip?.agency_price_per_person ?? null,
      totals,
      collectedLabel: formatMoney(totals.collected, currency),
      pendingLabel: formatMoney(totals.pending, currency),
      travelerCount: (participants ?? []).filter((p) => p.trip_id === tripId).length,
    };
  });

  const travelerMap = new Map<
    string,
    {
      email: string;
      displayName: string;
      trips: Array<{
        tripId: string;
        tripName: string;
        overall: keyof typeof PAYMENT_OVERALL_LABELS;
        overallLabel: string;
        depositDueAt: string | null;
        finalDueAt: string | null;
      }>;
    }
  >();

  const payByKey = new Map(payRows.map((p) => [`${p.trip_id}:${p.participant_id}`, p]));

  for (const p of participants ?? []) {
    const email = ((p.email as string) || "").trim().toLowerCase();
    if (!email) continue;
    const key = email;
    const trip = tripById.get(p.trip_id as string);
    const pay = payByKey.get(`${p.trip_id}:${p.id}`);
    const summary = pay
      ? summarizeParticipantPayment(pay)
      : { overall: "pending" as const };
    const entry = travelerMap.get(key) ?? {
      email,
      displayName: (p.display_name as string) || email,
      trips: [],
    };
    if (!entry.displayName && p.display_name) entry.displayName = p.display_name as string;
    entry.trips.push({
      tripId: p.trip_id as string,
      tripName: (trip?.name as string) || "Viaje",
      overall: summary.overall,
      overallLabel: PAYMENT_OVERALL_LABELS[summary.overall],
      depositDueAt: (pay?.deposit_due_at as string | null)?.slice(0, 10) ?? null,
      finalDueAt: (pay?.final_due_at as string | null)?.slice(0, 10) ?? null,
    });
    travelerMap.set(key, entry);
  }

  const travelers = [...travelerMap.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es")
  );

  return NextResponse.json({
    totals: globalTotals,
    trips: tripSummaries.filter((t) => t.travelerCount > 0 || t.totals.collected > 0),
    travelers,
  });
}
