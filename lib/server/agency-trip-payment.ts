import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getAppUrl, getStripe } from "@/lib/stripe";
import {
  computePaymentAmounts,
  generatePayToken,
  type PaymentPhase,
} from "@/lib/agency/payments";
import {
  defaultInstallmentsFromAmounts,
  getPaymentInstallments,
  legacyPatchFromInstallments,
} from "@/lib/agency/payment-schedule";

export type ApplyParticipantPricingResult = {
  applied: number;
  skipped: Array<{ participantId: string; reason: string }>;
};

/** Asigna precio y plazos solo a los viajeros indicados (cada uno puede tener otro importe). */
export async function applyParticipantPaymentPricing(opts: {
  tripId: string;
  agencyId: string;
  participantIds: string[];
  pricePerPerson: number;
  depositPercent: number;
  depositDueDate: string | null;
  finalDueDate: string | null;
}): Promise<ApplyParticipantPricingResult> {
  const admin = createSupabaseAdmin();
  const { deposit, final } = computePaymentAmounts(opts.pricePerPerson, opts.depositPercent);
  const skipped: ApplyParticipantPricingResult["skipped"] = [];
  let applied = 0;

  const uniqueIds = [...new Set(opts.participantIds.filter(Boolean))];
  if (!uniqueIds.length) return { applied: 0, skipped };

  const { data: viewers } = await admin
    .from("trip_participants")
    .select("id")
    .eq("trip_id", opts.tripId)
    .eq("role", "viewer")
    .neq("status", "removed")
    .in("id", uniqueIds);

  const validIds = new Set((viewers ?? []).map((v) => v.id as string));

  for (const participantId of uniqueIds) {
    if (!validIds.has(participantId)) {
      skipped.push({ participantId, reason: "Viajero no encontrado en el viaje." });
      continue;
    }

    const { data: existing } = await admin
      .from("agency_participant_payments")
      .select("id, deposit_status, final_status, pay_token_deposit, pay_token_final")
      .eq("trip_id", opts.tripId)
      .eq("participant_id", participantId)
      .maybeSingle();

    if (
      existing &&
      (existing.deposit_status !== "pending" || existing.final_status !== "pending")
    ) {
      skipped.push({
        participantId,
        reason: "Ya tiene pagos registrados; no se puede cambiar el precio.",
      });
      continue;
    }

    const installments = defaultInstallmentsFromAmounts({
      pricePerPerson: opts.pricePerPerson,
      depositPercent: opts.depositPercent,
      depositDueAt: opts.depositDueDate,
      finalDueAt: opts.finalDueDate,
    });
    const row = {
      ...legacyPatchFromInstallments(installments),
      deposit_percent: opts.depositPercent,
      pay_token_deposit: existing?.pay_token_deposit || generatePayToken(),
      pay_token_final: existing?.pay_token_final || generatePayToken(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await admin
        .from("agency_participant_payments")
        .update(row)
        .eq("id", existing.id);
      if (error) {
        skipped.push({ participantId, reason: error.message });
        continue;
      }
    } else {
      const { error } = await admin.from("agency_participant_payments").insert({
        trip_id: opts.tripId,
        participant_id: participantId,
        agency_id: opts.agencyId,
        ...row,
      });
      if (error) {
        skipped.push({ participantId, reason: error.message });
        continue;
      }
    }
    applied += 1;
  }

  return { applied, skipped };
}

/** Rellena tokens de pago en filas ya creadas (tras asignar precios por viajero). */
export async function syncAgencyParticipantPayments(tripId: string, _agencyId: string) {
  const admin = createSupabaseAdmin();

  const { data: rows } = await admin
    .from("agency_participant_payments")
    .select("id, pay_token_deposit, pay_token_final, price_per_person")
    .eq("trip_id", tripId);

  if (!rows?.length) return { created: 0, reason: "no_rows" as const };

  let created = 0;
  for (const row of rows) {
    const patch: Record<string, string> = {};
    if (!row.pay_token_deposit) patch.pay_token_deposit = generatePayToken();
    if (!row.pay_token_final) patch.pay_token_final = generatePayToken();
    if (!Object.keys(patch).length) continue;
    patch.updated_at = new Date().toISOString();
    await admin.from("agency_participant_payments").update(patch).eq("id", row.id);
    created += 1;
  }

  return { created, reason: "ok" as const };
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

  const { data: payRow } = await admin
    .from("agency_participant_payments")
    .select("*")
    .eq("id", paymentRowId)
    .maybeSingle();

  const installments = payRow ? getPaymentInstallments(payRow) : [];
  const next = installments.map((inst) => ({ ...inst }));

  if (phase === "deposit" && next[0]) {
    next[0] = {
      ...next[0],
      status: "paid",
      paidAt: now,
      paymentMethod: "stripe",
      stripeSessionId: session.id,
    };
  } else if (phase === "final") {
    for (let i = 1; i < next.length; i++) {
      if (next[i]!.status !== "paid") {
        next[i] = {
          ...next[i]!,
          status: "paid",
          paidAt: now,
          paymentMethod: "stripe",
          stripeSessionId: i === 1 ? session.id : next[i]!.stripeSessionId ?? null,
        };
      }
    }
  }

  const patch = payRow
    ? { ...legacyPatchFromInstallments(next), updated_at: now }
    : phase === "deposit"
      ? {
          deposit_status: "paid",
          deposit_paid_at: now,
          deposit_stripe_session_id: session.id,
          deposit_payment_method: "stripe",
          updated_at: now,
        }
      : {
          final_status: "paid",
          final_paid_at: now,
          final_stripe_session_id: session.id,
          final_payment_method: "stripe",
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
