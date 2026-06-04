import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { sendAgencyTripEmailBatch } from "@/lib/server/agency-trip-emails";

type Params = { params: { tripId: string } };

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const daysBefore = Math.max(0, Math.min(14, Number(body?.daysBefore ?? 2) || 2));
  const origin = new URL(req.url).origin;
  const targetDate = addDaysIso(new Date().toISOString().slice(0, 10), daysBefore);

  const { data: rows, error } = await gate.supabase
    .from("agency_participant_payments")
    .select("participant_id, deposit_status, final_status, deposit_due_at, final_due_at")
    .eq("trip_id", params.tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const depositIds: string[] = [];
  const finalIds: string[] = [];

  for (const row of rows ?? []) {
    const pid = row.participant_id as string;
    const depositDue = (row.deposit_due_at as string | null)?.slice(0, 10) ?? null;
    const finalDue = (row.final_due_at as string | null)?.slice(0, 10) ?? null;

    if (
      row.deposit_status === "pending" &&
      depositDue === targetDate
    ) {
      depositIds.push(pid);
    } else if (
      row.deposit_status === "paid" &&
      row.final_status === "pending" &&
      finalDue === targetDate
    ) {
      finalIds.push(pid);
    }
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (depositIds.length) {
    const r = await sendAgencyTripEmailBatch({
      tripId: params.tripId,
      agencyId: gate.ctx.agency.id,
      event: "deposit_reminder",
      origin,
      participantIds: depositIds,
    });
    sent += r.sent;
    skipped += r.skipped;
    if (r.errors?.length) errors.push(...r.errors);
  }

  if (finalIds.length) {
    const r = await sendAgencyTripEmailBatch({
      tripId: params.tripId,
      agencyId: gate.ctx.agency.id,
      event: "final_reminder",
      origin,
      participantIds: finalIds,
    });
    sent += r.sent;
    skipped += r.skipped;
    if (r.errors?.length) errors.push(...r.errors);
  }

  if (!depositIds.length && !finalIds.length) {
    return NextResponse.json({
      sent: 0,
      skipped: 0,
      targetDate,
      message: `Ningún viajero con vencimiento el ${targetDate}.`,
    });
  }

  return NextResponse.json({
    sent,
    skipped,
    targetDate,
    depositCount: depositIds.length,
    finalCount: finalIds.length,
    errors: errors.slice(0, 5),
  });
}
