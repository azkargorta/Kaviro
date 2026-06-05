import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { AgencyPaymentMethod } from "@/lib/agency/payment-record";
import type { PaymentPhase } from "@/lib/agency/payments";
import {
  findInstallment,
  getPaymentInstallments,
  legacyPatchFromInstallments,
  mergePlanWithExisting,
  type PaymentInstallment,
} from "@/lib/agency/payment-schedule";

const RECEIPT_BUCKET = "agency-payment-receipts";
const MAX_RECEIPT_BYTES = 12 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function uploadAgencyPaymentReceipt(opts: {
  tripId: string;
  paymentRowId: string;
  installmentId: string;
  file: File;
}) {
  if (opts.file.size > MAX_RECEIPT_BYTES) {
    throw new Error("El justificante supera el límite de 12 MB.");
  }
  const mime = opts.file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Formato no admitido. Usa PDF o imagen (JPG, PNG, WebP).");
  }

  const ext = opts.file.name.includes(".") ? opts.file.name.split(".").pop() : "bin";
  const safeName = `${opts.installmentId}-${crypto.randomUUID()}.${ext}`;
  const path = `${opts.tripId}/${opts.paymentRowId}/${safeName}`;

  const admin = createSupabaseAdmin();
  const buffer = Buffer.from(await opts.file.arrayBuffer());
  const { error } = await admin.storage.from(RECEIPT_BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: mime,
  });
  if (error) throw new Error(error.message);

  return { path, name: opts.file.name, mime };
}

async function syncParticipantBookingStatus(
  admin: ReturnType<typeof createSupabaseAdmin>,
  tripId: string,
  participantId: string,
  installments: PaymentInstallment[]
) {
  const now = new Date().toISOString();
  const allPaid = installments.length > 0 && installments.every((i) => i.status === "paid");
  const firstPaid = installments[0]?.status === "paid";

  if (allPaid) {
    await admin
      .from("trip_participants")
      .update({ booking_status: "confirmed", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  } else if (firstPaid) {
    await admin
      .from("trip_participants")
      .update({ booking_status: "deposit_paid", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  } else {
    await admin
      .from("trip_participants")
      .update({ booking_status: "reserved", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  }
}

function assertPriorInstallmentsPaid(installments: PaymentInstallment[], index: number) {
  for (let i = 0; i < index; i++) {
    if (installments[i]?.status !== "paid") {
      throw new Error(`Registra primero la cuota «${installments[i]?.label}».`);
    }
  }
}

export async function recordAgencyParticipantPayment(opts: {
  tripId: string;
  participantId: string;
  installmentId?: string;
  phase?: PaymentPhase;
  status: "paid" | "pending";
  amount?: number | null;
  dueAt?: string | null;
  paymentMethod?: AgencyPaymentMethod;
  paidAt?: string | null;
  notes?: string | null;
  recordedByUserId: string;
  receipt?: { path: string; name: string; mime: string } | null;
}) {
  const admin = createSupabaseAdmin();
  const { data: row, error: rowErr } = await admin
    .from("agency_participant_payments")
    .select("*")
    .eq("trip_id", opts.tripId)
    .eq("participant_id", opts.participantId)
    .maybeSingle();

  if (rowErr) throw new Error(rowErr.message);
  if (!row) throw new Error("Este viajero no tiene cobro configurado.");

  const installments = getPaymentInstallments(row);
  const target = findInstallment(installments, {
    installmentId: opts.installmentId,
    phase: opts.phase,
  });
  if (!target) throw new Error("Cuota no encontrada.");

  const index = installments.findIndex((i) => i.id === target.id);
  if (index < 0) throw new Error("Cuota no encontrada.");

  if (opts.status === "paid") {
    assertPriorInstallmentsPaid(installments, index);
  }

  const now = new Date().toISOString();
  const next = installments.map((inst) => ({ ...inst }));

  if (opts.amount != null && Number.isFinite(opts.amount) && opts.amount >= 0) {
    next[index]!.amount = Math.round(opts.amount * 100) / 100;
  }
  if (opts.dueAt !== undefined) {
    next[index]!.dueAt = opts.dueAt?.slice(0, 10) ?? null;
  }

  if (opts.status === "paid") {
    next[index] = {
      ...next[index]!,
      status: "paid",
      paidAt: opts.paidAt || now,
      paymentMethod: opts.paymentMethod || "transfer",
      recordedBy: opts.recordedByUserId,
      manualNotes: opts.notes?.trim() || null,
      ...(opts.receipt
        ? {
            receiptPath: opts.receipt.path,
            receiptName: opts.receipt.name,
            receiptMime: opts.receipt.mime,
          }
        : {}),
    };
  } else {
    next[index] = {
      ...next[index]!,
      status: "pending",
      paidAt: null,
      paymentMethod: null,
      recordedBy: null,
      manualNotes: null,
      receiptPath: null,
      receiptName: null,
      receiptMime: null,
    };
  }

  const patch = {
    ...legacyPatchFromInstallments(next),
    updated_at: now,
  };

  const { error: updErr } = await admin
    .from("agency_participant_payments")
    .update(patch)
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  await syncParticipantBookingStatus(admin, opts.tripId, opts.participantId, next);

  return { paymentRowId: row.id as string };
}

export async function saveAgencyParticipantPaymentSchedule(opts: {
  tripId: string;
  participantId: string;
  installments: Array<{ id?: string; label: string; amount: number; dueAt?: string | null }>;
}) {
  const admin = createSupabaseAdmin();
  const { data: row, error: rowErr } = await admin
    .from("agency_participant_payments")
    .select("*")
    .eq("trip_id", opts.tripId)
    .eq("participant_id", opts.participantId)
    .maybeSingle();

  if (rowErr) throw new Error(rowErr.message);
  if (!row) throw new Error("Este viajero no tiene cobro configurado.");

  const existing = getPaymentInstallments(row);
  const merged = mergePlanWithExisting(existing, opts.installments);

  if (!merged.length) throw new Error("Añade al menos una cuota.");
  if (merged.some((i) => !Number.isFinite(i.amount) || i.amount < 0)) {
    throw new Error("Importe de cuota no válido.");
  }

  const patch = {
    ...legacyPatchFromInstallments(merged),
    updated_at: new Date().toISOString(),
  };

  const { error: updErr } = await admin
    .from("agency_participant_payments")
    .update(patch)
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  return { paymentRowId: row.id as string };
}

export async function signedAgencyReceiptUrl(path: string | null | undefined) {
  if (!path) return null;
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
