import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import {
  AGENCY_EMAIL_EVENTS,
  AGENCY_EMAIL_EVENT_DESCRIPTIONS,
  AGENCY_EMAIL_EVENT_LABELS,
  isAgencyEmailEvent,
} from "@/lib/agency/email-events";
import { getAppOrigin } from "@/lib/email/get-app-origin";
import {
  getTripEmailAutomation,
  sendAgencyTripEmailBatch,
  sendAllEnabledTripReminders,
  upsertTripEmailAutomation,
} from "@/lib/server/agency-trip-emails";

type Params = { params: { tripId: string } };

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_emails.sql" });
}

function isMigration(msg: string) {
  return msg.includes("agency_trip_email_automation") || msg.includes("agency_email_log");
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const settings = await getTripEmailAutomation(params.tripId, gate.ctx.agency.id);

    const { data: log, error } = await gate.supabase
      .from("agency_email_log")
      .select("id, event_type, recipient_email, status, error_message, created_at")
      .eq("trip_id", params.tripId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error && isMigration(error.message)) return migration();

    const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

    return NextResponse.json({
      settings,
      resendConfigured,
      events: AGENCY_EMAIL_EVENTS.map((id) => ({
        id,
        label: AGENCY_EMAIL_EVENT_LABELS[id],
        description: AGENCY_EMAIL_EVENT_DESCRIPTIONS[id],
      })),
      recentLog: log ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const patch: Partial<{
    remindDeposit: boolean;
    remindFinal: boolean;
    pretravelInvite: boolean;
    npsInvite: boolean;
  }> = {};
  if (typeof body?.remindDeposit === "boolean") patch.remindDeposit = body.remindDeposit;
  if (typeof body?.remindFinal === "boolean") patch.remindFinal = body.remindFinal;
  if (typeof body?.pretravelInvite === "boolean") patch.pretravelInvite = body.pretravelInvite;
  if (typeof body?.npsInvite === "boolean") patch.npsInvite = body.npsInvite;

  try {
    const settings = await upsertTripEmailAutomation(params.tripId, gate.ctx.agency.id, patch);
    return NextResponse.json({ settings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error: "RESEND_API_KEY no configurada. Añádela en Vercel o copia los enlaces manualmente.",
        resendConfigured: false,
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const origin =
    (typeof body?.origin === "string" ? body.origin : "") ||
    (await getAppOrigin()) ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  try {
    if (body?.sendAll === true) {
      const result = await sendAllEnabledTripReminders({
        tripId: params.tripId,
        agencyId: gate.ctx.agency.id,
        origin,
      });
      return NextResponse.json(result);
    }

    const event = body?.eventType;
    if (!isAgencyEmailEvent(event)) {
      return NextResponse.json({ error: "eventType no válido." }, { status: 400 });
    }

    const participantIds = Array.isArray(body?.participantIds)
      ? body.participantIds.filter((id: unknown) => typeof id === "string")
      : undefined;

    const result = await sendAgencyTripEmailBatch({
      tripId: params.tripId,
      agencyId: gate.ctx.agency.id,
      event,
      origin,
      participantIds,
      skipDedupe: Boolean(body?.skipDedupe),
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
