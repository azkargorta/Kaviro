import { NextResponse } from "next/server";
import { extractReceiptInfo } from "@/lib/agency/payment-record";
import {
  formatMoney,
  payPublicPath,
  summarizeParticipantPayment,
  tripPaymentsSummary,
} from "@/lib/agency/payments";
import { signedAgencyReceiptUrl } from "@/lib/server/record-agency-payment";
import type { requireAgencyTripAccess } from "@/lib/require-agency-trip";

type AgencyTripGate = Extract<
  Awaited<ReturnType<typeof requireAgencyTripAccess>>,
  { supabase: unknown }
>;

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_payments.sql" });
}

function receiptsMigration() {
  return NextResponse.json({
    needsMigration: true,
    migration: "kaviro_agency_payment_receipts.sql",
  });
}

function isMigration(msg: string) {
  return msg.includes("agency_participant_payments") || msg.includes("agency_price_per_person");
}

function isReceiptsMigration(msg: string) {
  return msg.includes("deposit_receipt_path") || msg.includes("deposit_payment_method");
}

export async function buildAgencyTripPaymentsPayload(gate: AgencyTripGate, tripId: string) {
  const { data: trip, error: tErr } = await gate.supabase
    .from("trips")
    .select(
      "name, agency_price_per_person, agency_deposit_percent, agency_deposit_due_date, agency_final_due_date, agency_payment_currency"
    )
    .eq("id", tripId)
    .maybeSingle();

  if (tErr && isMigration(tErr.message)) return { error: migration() };

  const paymentSelect =
    "id, participant_id, price_per_person, deposit_amount, final_amount, deposit_status, final_status, deposit_due_at, final_due_at, pay_token_deposit, pay_token_final, deposit_paid_at, final_paid_at, deposit_payment_method, final_payment_method, deposit_receipt_path, deposit_receipt_name, deposit_receipt_mime, final_receipt_path, final_receipt_name, final_receipt_mime, deposit_manual_notes, final_manual_notes";

  const { data: payments, error } = await gate.supabase
    .from("agency_participant_payments")
    .select(paymentSelect)
    .eq("trip_id", tripId);

  if (error) {
    if (isMigration(error.message)) return { error: migration() };
    if (isReceiptsMigration(error.message)) return { error: receiptsMigration() };
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  const { data: participants } = await gate.supabase
    .from("trip_participants")
    .select("id, display_name, email, booking_status")
    .eq("trip_id", tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  const payByParticipant = new Map((payments ?? []).map((p) => [p.participant_id as string, p]));
  const currency = (trip?.agency_payment_currency as string) || "EUR";

  const roster = await Promise.all(
    (participants ?? []).map(async (p) => {
      const pay = payByParticipant.get(p.id as string);
      const summary = pay
        ? summarizeParticipantPayment(pay)
        : {
            overall: "pending" as const,
            depositStatus: "pending" as const,
            finalStatus: "pending" as const,
          };

      const depositReceiptUrl = pay?.deposit_receipt_path
        ? await signedAgencyReceiptUrl(pay.deposit_receipt_path as string)
        : null;
      const finalReceiptUrl = pay?.final_receipt_path
        ? await signedAgencyReceiptUrl(pay.final_receipt_path as string)
        : null;

      return {
        participantId: p.id,
        displayName: p.display_name,
        email: p.email,
        bookingStatus: p.booking_status,
        payment: pay
          ? {
              id: pay.id,
              pricePerPerson: pay.price_per_person,
              depositAmount: pay.deposit_amount,
              finalAmount: pay.final_amount,
              depositStatus: pay.deposit_status,
              finalStatus: pay.final_status,
              depositDueAt: pay.deposit_due_at,
              finalDueAt: pay.final_due_at,
              depositPaidAt: pay.deposit_paid_at,
              finalPaidAt: pay.final_paid_at,
              depositPayUrl: pay.pay_token_deposit ? payPublicPath(pay.pay_token_deposit as string) : null,
              finalPayUrl: pay.pay_token_final ? payPublicPath(pay.pay_token_final as string) : null,
              deposit: extractReceiptInfo(pay as Record<string, unknown>, "deposit", depositReceiptUrl),
              final: extractReceiptInfo(pay as Record<string, unknown>, "final", finalReceiptUrl),
              summary,
            }
          : null,
      };
    })
  );

  const summary = tripPaymentsSummary(
    (payments ?? []).map((p) => ({
      deposit_status: p.deposit_status as string,
      final_status: p.final_status as string,
      deposit_amount: Number(p.deposit_amount),
      final_amount: Number(p.final_amount),
    }))
  );

  return {
    payload: {
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
      charts: buildPaymentCharts(roster, currency),
    },
  };
}

export type AgencyPaymentRosterRow = Awaited<
  ReturnType<typeof buildAgencyTripPaymentsPayload>
> extends { payload: { roster: infer R } }
  ? R extends (infer U)[]
    ? U
    : never
  : never;

function buildPaymentCharts(
  roster: Array<{
    displayName: string | null;
    payment: {
      depositAmount: unknown;
      finalAmount: unknown;
      depositStatus: string;
      finalStatus: string;
      summary: { overall: string };
    } | null;
  }>,
  currency: string
) {
  const statusCounts = { pending: 0, deposit_paid: 0, paid: 0, cancelled: 0 };
  const travelers: Array<{
    name: string;
    collected: number;
    pending: number;
    overall: string;
  }> = [];

  for (const r of roster) {
    const pay = r.payment;
    if (!pay) continue;
    const overall = pay.summary.overall as keyof typeof statusCounts;
    if (overall in statusCounts) statusCounts[overall] += 1;

    let collected = 0;
    let pending = 0;
    const dep = Number(pay.depositAmount);
    const fin = Number(pay.finalAmount);
    if (pay.depositStatus === "paid") collected += dep;
    else if (pay.depositStatus !== "cancelled") pending += dep;
    if (pay.finalStatus === "paid") collected += fin;
    else if (pay.finalStatus !== "cancelled" && pay.depositStatus === "paid") pending += fin;

    travelers.push({
      name: r.displayName || "Viajero",
      collected: Math.round(collected * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      overall: pay.summary.overall,
    });
  }

  return { statusCounts, travelers, currency };
}
