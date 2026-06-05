import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import type { AgencyPaymentMethod } from "@/lib/agency/payment-record";
import type { PaymentPhase } from "@/lib/agency/payments";
import {
  recordAgencyParticipantPayment,
  uploadAgencyPaymentReceipt,
} from "@/lib/server/record-agency-payment";
import { buildAgencyTripPaymentsPayload } from "@/lib/server/agency-payments-payload";

type Params = { params: { tripId: string } };

function migration() {
  return NextResponse.json({
    needsMigration: true,
    migration: "kaviro_agency_payment_receipts.sql",
  });
}

function isMigration(msg: string) {
  return (
    msg.includes("agency_participant_payments") ||
    msg.includes("deposit_receipt_path") ||
    msg.includes("deposit_payment_method")
  );
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const form = await req.formData();
    const participantId = String(form.get("participantId") || "").trim();
    const phase = String(form.get("phase") || "").trim() as PaymentPhase;
    const status = String(form.get("status") || "paid").trim() as "paid" | "pending";
    const paymentMethod = String(form.get("paymentMethod") || "transfer").trim() as AgencyPaymentMethod;
    const paidAt = String(form.get("paidAt") || "").trim() || null;
    const notes = String(form.get("notes") || "").trim() || null;
    const receiptFile = form.get("receipt");

    if (!participantId) {
      return NextResponse.json({ error: "Falta el viajero." }, { status: 400 });
    }
    if (phase !== "deposit" && phase !== "final") {
      return NextResponse.json({ error: "Fase de cobro no válida." }, { status: 400 });
    }
    if (status !== "paid" && status !== "pending") {
      return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    }

    let receipt: { path: string; name: string; mime: string } | null = null;
    if (receiptFile instanceof File && receiptFile.size > 0) {
      const { data: payRow } = await gate.supabase
        .from("agency_participant_payments")
        .select("id")
        .eq("trip_id", params.tripId)
        .eq("participant_id", participantId)
        .maybeSingle();

      if (!payRow?.id) {
        return NextResponse.json({ error: "Sin cobro configurado para este viajero." }, { status: 400 });
      }

      receipt = await uploadAgencyPaymentReceipt({
        tripId: params.tripId,
        paymentRowId: payRow.id as string,
        phase,
        file: receiptFile,
      });
    }

    await recordAgencyParticipantPayment({
      tripId: params.tripId,
      participantId,
      phase,
      status,
      paymentMethod: status === "paid" ? paymentMethod : undefined,
      paidAt,
      notes,
      recordedByUserId: gate.user.id,
      receipt: status === "paid" ? receipt : null,
    });

    const built = await buildAgencyTripPaymentsPayload(gate, params.tripId);
    if ("error" in built) return built.error;
    return NextResponse.json(built.payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo registrar el cobro.";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
