import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  receiptFieldsForPhase,
  type AgencyPaymentMethod,
} from "@/lib/agency/payment-record";
import type { PaymentPhase } from "@/lib/agency/payments";

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
  phase: PaymentPhase;
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
  const safeName = `${opts.phase}-${crypto.randomUUID()}.${ext}`;
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
  participantId: string
) {
  const { data: row } = await admin
    .from("agency_participant_payments")
    .select("deposit_status, final_status")
    .eq("trip_id", tripId)
    .eq("participant_id", participantId)
    .maybeSingle();

  const now = new Date().toISOString();
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
  } else {
    await admin
      .from("trip_participants")
      .update({ booking_status: "reserved", updated_at: now })
      .eq("id", participantId)
      .eq("trip_id", tripId);
  }
}

export async function recordAgencyParticipantPayment(opts: {
  tripId: string;
  participantId: string;
  phase: PaymentPhase;
  status: "paid" | "pending";
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

  if (opts.phase === "final" && opts.status === "paid" && row.deposit_status !== "paid") {
    throw new Error("Registra primero la señal como pagada.");
  }

  const fields = receiptFieldsForPhase(opts.phase);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (opts.status === "paid") {
    patch[fields.status] = "paid";
    patch[fields.paidAt] = opts.paidAt || now;
    patch[fields.method] = opts.paymentMethod || "transfer";
    patch[fields.recordedBy] = opts.recordedByUserId;
    patch[fields.notes] = opts.notes?.trim() || null;
    if (opts.receipt) {
      patch[fields.path] = opts.receipt.path;
      patch[fields.name] = opts.receipt.name;
      patch[fields.mime] = opts.receipt.mime;
    }
  } else {
    patch[fields.status] = "pending";
    patch[fields.paidAt] = null;
    patch[fields.method] = null;
    patch[fields.recordedBy] = null;
    patch[fields.notes] = null;
    patch[fields.path] = null;
    patch[fields.name] = null;
    patch[fields.mime] = null;
  }

  const { error: updErr } = await admin
    .from("agency_participant_payments")
    .update(patch)
    .eq("id", row.id);
  if (updErr) throw new Error(updErr.message);

  await syncParticipantBookingStatus(admin, opts.tripId, opts.participantId);

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
