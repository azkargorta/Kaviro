import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import {
  formatMoney,
  payPublicPath,
  summarizeParticipantPayment,
  tripPaymentsSummary,
} from "@/lib/agency/payments";
import { syncAgencyParticipantPayments } from "@/lib/server/agency-trip-payment";

type Params = { params: { tripId: string } };

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_payments.sql" });
}

function isMigration(msg: string) {
  return msg.includes("agency_participant_payments") || msg.includes("agency_price_per_person");
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: trip, error: tErr } = await gate.supabase
    .from("trips")
    .select(
      "name, agency_price_per_person, agency_deposit_percent, agency_deposit_due_date, agency_final_due_date, agency_payment_currency"
    )
    .eq("id", params.tripId)
    .maybeSingle();

  if (tErr && isMigration(tErr.message)) return migration();

  const { data: payments, error } = await gate.supabase
    .from("agency_participant_payments")
    .select(
      "id, participant_id, price_per_person, deposit_amount, final_amount, deposit_status, final_status, deposit_due_at, final_due_at, pay_token_deposit, pay_token_final"
    )
    .eq("trip_id", params.tripId);

  if (error) {
    if (isMigration(error.message)) return migration();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: participants } = await gate.supabase
    .from("trip_participants")
    .select("id, display_name, email, booking_status")
    .eq("trip_id", params.tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  const payByParticipant = new Map((payments ?? []).map((p) => [p.participant_id as string, p]));

  const currency = (trip?.agency_payment_currency as string) || "EUR";
  const roster = (participants ?? []).map((p) => {
    const pay = payByParticipant.get(p.id as string);
    const summary = pay
      ? summarizeParticipantPayment(pay)
      : { overall: "pending" as const, depositStatus: "pending" as const, finalStatus: "pending" as const };
    return {
      participantId: p.id,
      displayName: p.display_name,
      email: p.email,
      bookingStatus: p.booking_status,
      payment: pay
        ? {
            id: pay.id,
            depositAmount: pay.deposit_amount,
            finalAmount: pay.final_amount,
            depositStatus: pay.deposit_status,
            finalStatus: pay.final_status,
            depositDueAt: pay.deposit_due_at,
            finalDueAt: pay.final_due_at,
            depositPayUrl: pay.pay_token_deposit ? payPublicPath(pay.pay_token_deposit as string) : null,
            finalPayUrl: pay.pay_token_final ? payPublicPath(pay.pay_token_final as string) : null,
            summary,
          }
        : null,
    };
  });

  const summary = tripPaymentsSummary(
    (payments ?? []).map((p) => ({
      deposit_status: p.deposit_status as string,
      final_status: p.final_status as string,
      deposit_amount: Number(p.deposit_amount),
      final_amount: Number(p.final_amount),
    }))
  );

  return NextResponse.json({
    settings: {
      pricePerPerson: trip?.agency_price_per_person,
      depositPercent: trip?.agency_deposit_percent ?? 30,
      depositDueDate: trip?.agency_deposit_due_date,
      finalDueDate: trip?.agency_final_due_date,
      currency,
      priceLabel:
        trip?.agency_price_per_person != null
          ? formatMoney(Number(trip.agency_price_per_person), currency)
          : null,
    },
    roster,
    totals: summary,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body?.pricePerPerson !== undefined) {
    const n = body.pricePerPerson === null || body.pricePerPerson === "" ? null : Number(body.pricePerPerson);
    if (n !== null && (!Number.isFinite(n) || n <= 0)) {
      return NextResponse.json({ error: "Precio por persona no válido." }, { status: 400 });
    }
    patch.agency_price_per_person = n;
  }
  if (body?.depositPercent !== undefined) {
    const pct = Number(body.depositPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: "Porcentaje de señal: 0-100." }, { status: 400 });
    }
    patch.agency_deposit_percent = pct;
  }
  if (body?.depositDueDate !== undefined) {
    patch.agency_deposit_due_date = body.depositDueDate || null;
  }
  if (body?.finalDueDate !== undefined) {
    patch.agency_final_due_date = body.finalDueDate || null;
  }

  const { error } = await gate.supabase.from("trips").update(patch).eq("id", params.tripId);
  if (error) {
    if (isMigration(error.message)) return migration();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (patch.agency_price_per_person != null) {
    await syncAgencyParticipantPayments(params.tripId, gate.ctx.agency.id);
    const admin = (await import("@/lib/supabase-admin")).createSupabaseAdmin();
    const price = Number(patch.agency_price_per_person);
    const pct = Number(patch.agency_deposit_percent ?? 30);
    const { computePaymentAmounts } = await import("@/lib/agency/payments");
    const { deposit, final } = computePaymentAmounts(price, pct);
    await admin
      .from("agency_participant_payments")
      .update({
        price_per_person: price,
        deposit_percent: pct,
        deposit_amount: deposit,
        final_amount: final,
        updated_at: new Date().toISOString(),
      })
      .eq("trip_id", params.tripId)
      .eq("deposit_status", "pending")
      .eq("final_status", "pending");
  }

  return GET(req, { params });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const result = await syncAgencyParticipantPayments(params.tripId, gate.ctx.agency.id);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
