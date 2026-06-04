import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getAppUrl, getStripe } from "@/lib/stripe";
import {
  computePaymentAmounts,
  generatePayToken,
  type PaymentPhase,
} from "@/lib/agency/payments";

export async function syncAgencyParticipantPayments(tripId: string, agencyId: string) {
  const admin = createSupabaseAdmin();

  const { data: trip } = await admin
    .from("trips")
    .select(
      "agency_price_per_person, agency_deposit_percent, agency_deposit_due_date, agency_final_due_date"
    )
    .eq("id", tripId)
    .maybeSingle();

  const price = Number(trip?.agency_price_per_person);
  if (!Number.isFinite(price) || price <= 0) return { created: 0, reason: "no_price" as const };

  const depositPercent = Number(trip?.agency_deposit_percent ?? 30);
  const { deposit, final } = computePaymentAmounts(price, depositPercent);

  const { data: viewers } = await admin
    .from("trip_participants")
    .select("id")
    .eq("trip_id", tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  const { data: existing } = await admin
    .from("agency_participant_payments")
    .select("participant_id")
    .eq("trip_id", tripId);

  const have = new Set((existing ?? []).map((r) => r.participant_id as string));
  const toCreate = (viewers ?? []).filter((v) => !have.has(v.id as string));

  if (!toCreate.length) return { created: 0, reason: "ok" as const };

  await admin.from("agency_participant_payments").insert(
    toCreate.map((v) => ({
      trip_id: tripId,
      participant_id: v.id,
      agency_id: agencyId,
      price_per_person: price,
      deposit_percent: depositPercent,
      deposit_amount: deposit,
      final_amount: final,
      deposit_due_at: trip?.agency_deposit_due_date ?? null,
      final_due_at: trip?.agency_final_due_date ?? null,
      pay_token_deposit: generatePayToken(),
      pay_token_final: generatePayToken(),
    }))
  );

  return { created: toCreate.length, reason: "ok" as const };
}

export async function createAgencyTripCheckoutSession(opts: {
  tripId: string;
  participantId: string;
  phase: PaymentPhase;
  origin: string;
}) {
  const admin = createSupabaseAdmin();
  const stripe = getStripe();

  const { data: row } = await admin
    .from("agency_participant_payments")
    .select(
      "id, trip_id, participant_id, agency_id, deposit_amount, final_amount, deposit_status, final_status, pay_token_deposit, pay_token_final"
    )
    .eq("trip_id", opts.tripId)
    .eq("participant_id", opts.participantId)
    .maybeSingle();

  if (!row) throw new Error("Registro de cobro no encontrado.");

  const phase = opts.phase;
  const alreadyPaid = phase === "deposit" ? row.deposit_status === "paid" : row.final_status === "paid";
  if (alreadyPaid) throw new Error("Este pago ya está registrado como pagado.");

  if (phase === "final" && row.deposit_status !== "paid") {
    throw new Error("La señal debe pagarse antes del pago final.");
  }

  const amount = phase === "deposit" ? Number(row.deposit_amount) : Number(row.final_amount);
  const currency = (
    await admin.from("trips").select("agency_payment_currency, name").eq("id", opts.tripId).maybeSingle()
  ).data;

  const cur = (currency?.agency_payment_currency as string) || "EUR";
  const tripName = (currency?.name as string) || "Viaje";

  const { data: participant } = await admin
    .from("trip_participants")
    .select("display_name, email")
    .eq("id", opts.participantId)
    .maybeSingle();

  const amountCents = Math.round(amount * 100);
  if (amountCents < 50) throw new Error("Importe demasiado bajo para Stripe.");

  const token = phase === "deposit" ? row.pay_token_deposit : row.pay_token_final;
  const successUrl = `${opts.origin}/pay/${token}?paid=1`;
  const cancelUrl = `${opts.origin}/pay/${token}?cancel=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: cur.toLowerCase(),
          unit_amount: amountCents,
          product_data: {
            name:
              phase === "deposit"
                ? `Señal — ${tripName}`
                : `Pago final — ${tripName}`,
            description: participant?.display_name
              ? `Viajero: ${participant.display_name}`
              : undefined,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: participant?.email || undefined,
    metadata: {
      type: "agency_trip_payment",
      trip_id: opts.tripId,
      participant_id: opts.participantId,
      agency_id: row.agency_id as string,
      phase,
      payment_row_id: row.id as string,
    },
  });

  const patch =
    phase === "deposit"
      ? { deposit_stripe_session_id: session.id, updated_at: new Date().toISOString() }
      : { final_stripe_session_id: session.id, updated_at: new Date().toISOString() };

  await admin.from("agency_participant_payments").update(patch).eq("id", row.id);

  if (!session.url) throw new Error("Stripe no devolvió URL de pago.");
  return session.url;
}

export async function markAgencyPaymentPaidFromSession(session: {
  id: string;
  metadata?: Record<string, string> | null;
  payment_status?: string | null;
}) {
  if (session.payment_status && session.payment_status !== "paid") return;

  const meta = session.metadata || {};
  if (meta.type !== "agency_trip_payment") return;

  const tripId = meta.trip_id;
  const participantId = meta.participant_id;
  const phase = meta.phase as PaymentPhase;
  const paymentRowId = meta.payment_row_id;

  if (!tripId || !participantId || !phase || !paymentRowId) return;

  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();

  const patch =
    phase === "deposit"
      ? {
          deposit_status: "paid",
          deposit_paid_at: now,
          deposit_stripe_session_id: session.id,
          updated_at: now,
        }
      : {
          final_status: "paid",
          final_paid_at: now,
          final_stripe_session_id: session.id,
          updated_at: now,
        };

  await admin.from("agency_participant_payments").update(patch).eq("id", paymentRowId);

  const { data: row } = await admin
    .from("agency_participant_payments")
    .select("deposit_status, final_status")
    .eq("id", paymentRowId)
    .maybeSingle();

  if (row?.deposit_status === "paid" && row.final_status === "paid") {
    await admin
      .from("trip_participants")
      .update({ booking_status: "confirmed", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  } else if (row?.deposit_status === "paid") {
    await admin
      .from("trip_participants")
      .update({ booking_status: "deposit_paid", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  }
}

export function agencyPaymentsAppOrigin(fallback?: string) {
  return getAppUrl() || fallback || "http://localhost:3000";
}
