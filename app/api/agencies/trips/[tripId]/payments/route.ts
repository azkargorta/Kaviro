import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import {
  applyParticipantPaymentPricing,
  syncAgencyParticipantPayments,
} from "@/lib/server/agency-trip-payment";
import { buildAgencyTripPaymentsPayload } from "@/lib/server/agency-payments-payload";

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

  const built = await buildAgencyTripPaymentsPayload(gate, params.tripId);
  if ("error" in built) return built.error;
  return NextResponse.json(built.payload);
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const tripPatch: Record<string, unknown> = {};

  let priceToAssign: number | null = null;
  if (body?.pricePerPerson !== undefined) {
    const n = body.pricePerPerson === null || body.pricePerPerson === "" ? null : Number(body.pricePerPerson);
    if (n !== null && (!Number.isFinite(n) || n <= 0)) {
      return NextResponse.json({ error: "Precio por persona no válido." }, { status: 400 });
    }
    if (n !== null) priceToAssign = n;
    tripPatch.agency_price_per_person = n;
  }

  let depositPercent = 30;
  if (body?.depositPercent !== undefined) {
    const pct = Number(body.depositPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: "Porcentaje de señal: 0-100." }, { status: 400 });
    }
    depositPercent = pct;
    tripPatch.agency_deposit_percent = pct;
  } else {
    const { data: tripRow } = await gate.supabase
      .from("trips")
      .select("agency_deposit_percent")
      .eq("id", params.tripId)
      .maybeSingle();
    depositPercent = Number(tripRow?.agency_deposit_percent ?? 30);
  }

  const depositDueDate =
    body?.depositDueDate !== undefined ? body.depositDueDate || null : undefined;
  const finalDueDate = body?.finalDueDate !== undefined ? body.finalDueDate || null : undefined;

  if (depositDueDate !== undefined) tripPatch.agency_deposit_due_date = depositDueDate;
  if (finalDueDate !== undefined) tripPatch.agency_final_due_date = finalDueDate;

  if (Object.keys(tripPatch).length) {
    const { error } = await gate.supabase.from("trips").update(tripPatch).eq("id", params.tripId);
    if (error) {
      if (isMigration(error.message)) return migration();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const participantIds = Array.isArray(body?.participantIds)
    ? (body.participantIds as unknown[]).filter((id): id is string => typeof id === "string")
    : [];

  if (priceToAssign != null) {
    if (!participantIds.length) {
      return NextResponse.json(
        { error: "Selecciona al menos un viajero para asignar este precio." },
        { status: 400 }
      );
    }

    const { data: tripDates } = await gate.supabase
      .from("trips")
      .select("agency_deposit_due_date, agency_final_due_date")
      .eq("id", params.tripId)
      .maybeSingle();

    const applyResult = await applyParticipantPaymentPricing({
      tripId: params.tripId,
      agencyId: gate.ctx.agency.id,
      participantIds,
      pricePerPerson: priceToAssign,
      depositPercent,
      depositDueDate:
        depositDueDate !== undefined
          ? depositDueDate
          : (tripDates?.agency_deposit_due_date as string | null) ?? null,
      finalDueDate:
        finalDueDate !== undefined
          ? finalDueDate
          : (tripDates?.agency_final_due_date as string | null) ?? null,
    });

    if (applyResult.applied === 0 && applyResult.skipped.length) {
      return NextResponse.json(
        { error: applyResult.skipped[0]?.reason ?? "No se pudo asignar el precio." },
        { status: 400 }
      );
    }

    const built = await buildAgencyTripPaymentsPayload(gate, params.tripId);
    if ("error" in built) return built.error;
    return NextResponse.json({
      ...built.payload,
      applyResult,
    });
  }

  if (depositDueDate !== undefined || finalDueDate !== undefined || body?.depositPercent !== undefined) {
    const admin = (await import("@/lib/supabase-admin")).createSupabaseAdmin();
    const duePatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body?.depositPercent !== undefined) duePatch.deposit_percent = depositPercent;
    if (depositDueDate !== undefined) duePatch.deposit_due_at = depositDueDate;
    if (finalDueDate !== undefined) duePatch.final_due_at = finalDueDate;
    await admin
      .from("agency_participant_payments")
      .update(duePatch)
      .eq("trip_id", params.tripId)
      .eq("deposit_status", "pending")
      .eq("final_status", "pending");
  }

  const built = await buildAgencyTripPaymentsPayload(gate, params.tripId);
  if ("error" in built) return built.error;
  return NextResponse.json(built.payload);
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
