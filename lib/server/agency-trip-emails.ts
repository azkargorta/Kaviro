import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import {
  DEFAULT_EMAIL_AUTOMATION,
  type AgencyEmailEvent,
  type EmailAutomationSettings,
  eventEnabledForSettings,
} from "@/lib/agency/email-events";
import { payPublicPath } from "@/lib/agency/payments";
import { pretravelPublicPath } from "@/lib/agency/pretravel-defaults";
import {
  agencyTravelerEmailSubject,
  buildAgencyTravelerEmailHtml,
} from "@/lib/email/build-agency-traveler-email";
import { sendTransactionalEmail } from "@/lib/email/send-transactional-email";

const DEDUPE_HOURS = 24;

type Recipient = {
  participantId: string;
  email: string;
  displayName: string;
  actionUrl: string;
};

function npsPublicPath(token: string) {
  return `/nps/${token}`;
}

export async function getTripEmailAutomation(tripId: string, agencyId: string): Promise<EmailAutomationSettings> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("agency_trip_email_automation")
    .select("remind_deposit, remind_final, pretravel_invite, nps_invite")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_EMAIL_AUTOMATION };

  return {
    remindDeposit: Boolean(data.remind_deposit),
    remindFinal: Boolean(data.remind_final),
    pretravelInvite: Boolean(data.pretravel_invite),
    npsInvite: Boolean(data.nps_invite),
  };
}

export async function upsertTripEmailAutomation(
  tripId: string,
  agencyId: string,
  settings: Partial<EmailAutomationSettings>
) {
  const admin = createSupabaseAdmin();
  const current = await getTripEmailAutomation(tripId, agencyId);
  const next = { ...current, ...settings };

  await admin.from("agency_trip_email_automation").upsert({
    trip_id: tripId,
    agency_id: agencyId,
    remind_deposit: next.remindDeposit,
    remind_final: next.remindFinal,
    pretravel_invite: next.pretravelInvite,
    nps_invite: next.npsInvite,
    updated_at: new Date().toISOString(),
  });

  return next;
}

async function wasRecentlySent(tripId: string, event: AgencyEmailEvent, email: string) {
  const admin = createSupabaseAdmin();
  const since = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("agency_email_log")
    .select("id")
    .eq("trip_id", tripId)
    .eq("event_type", event)
    .eq("recipient_email", email.toLowerCase())
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(1);

  return Boolean(data?.length);
}

async function logSend(opts: {
  tripId: string;
  agencyId: string;
  participantId: string | null;
  event: AgencyEmailEvent;
  email: string;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
}) {
  const admin = createSupabaseAdmin();
  await admin.from("agency_email_log").insert({
    trip_id: opts.tripId,
    agency_id: opts.agencyId,
    participant_id: opts.participantId,
    event_type: opts.event,
    recipient_email: opts.email.toLowerCase(),
    status: opts.status,
    error_message: opts.errorMessage ?? null,
  });
}

async function resolveRecipients(
  tripId: string,
  event: AgencyEmailEvent,
  origin: string,
  participantIds?: string[]
): Promise<Recipient[]> {
  const admin = createSupabaseAdmin();
  const filterIds = participantIds?.length ? new Set(participantIds) : null;

  if (event === "deposit_reminder" || event === "final_reminder") {
    const { data: rows } = await admin
      .from("agency_participant_payments")
      .select(
        "participant_id, deposit_status, final_status, pay_token_deposit, pay_token_final"
      )
      .eq("trip_id", tripId);

    const out: Recipient[] = [];
    for (const row of rows ?? []) {
      if (filterIds && !filterIds.has(row.participant_id as string)) continue;

      const token =
        event === "deposit_reminder"
          ? row.deposit_status === "pending"
            ? row.pay_token_deposit
            : null
          : row.deposit_status === "paid" && row.final_status === "pending"
            ? row.pay_token_final
            : null;

      if (!token) continue;

      const { data: p } = await admin
        .from("trip_participants")
        .select("id, email, display_name")
        .eq("id", row.participant_id)
        .maybeSingle();

      const email = (p?.email as string)?.trim();
      if (!email?.includes("@")) continue;

      out.push({
        participantId: p!.id as string,
        email,
        displayName: (p?.display_name as string) || "Viajero",
        actionUrl: `${origin}${payPublicPath(token as string)}`,
      });
    }
    return out;
  }

  if (event === "pretravel_invite") {
    const { data: rows } = await admin
      .from("agency_pretravel_responses")
      .select("participant_id, token, submitted_at")
      .eq("trip_id", tripId)
      .is("submitted_at", null);

    const out: Recipient[] = [];
    for (const row of rows ?? []) {
      if (!row.token) continue;
      if (filterIds && row.participant_id && !filterIds.has(row.participant_id as string)) continue;

      const { data: p } = await admin
        .from("trip_participants")
        .select("id, email, display_name")
        .eq("id", row.participant_id)
        .maybeSingle();

      const email = (p?.email as string)?.trim();
      if (!email?.includes("@")) continue;

      out.push({
        participantId: p!.id as string,
        email,
        displayName: (p?.display_name as string) || "Viajero",
        actionUrl: `${origin}${pretravelPublicPath(row.token as string)}`,
      });
    }
    return out;
  }

  if (event === "nps_invite") {
    const { data: rows } = await admin
      .from("agency_nps_responses")
      .select("participant_id, token, submitted_at")
      .eq("trip_id", tripId)
      .is("submitted_at", null);

    const out: Recipient[] = [];
    for (const row of rows ?? []) {
      if (!row.token) continue;
      if (filterIds && row.participant_id && !filterIds.has(row.participant_id as string)) continue;

      const { data: p } = await admin
        .from("trip_participants")
        .select("id, email, display_name")
        .eq("id", row.participant_id)
        .maybeSingle();

      const email = (p?.email as string)?.trim();
      if (!email?.includes("@")) continue;

      out.push({
        participantId: p!.id as string,
        email,
        displayName: (p?.display_name as string) || "Viajero",
        actionUrl: `${origin}${npsPublicPath(row.token as string)}`,
      });
    }
    return out;
  }

  return [];
}

export async function sendAgencyTripEmailBatch(opts: {
  tripId: string;
  agencyId: string;
  event: AgencyEmailEvent;
  origin: string;
  participantIds?: string[];
  skipDedupe?: boolean;
}) {
  const admin = createSupabaseAdmin();

  const [{ data: trip }, { data: agency }] = await Promise.all([
    admin.from("trips").select("name").eq("id", opts.tripId).maybeSingle(),
    admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", opts.agencyId)
      .maybeSingle(),
  ]);

  const branding = agency
    ? agencyBrandingFromRow(agency as AgencyRow)
    : agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);

  const tripName = (trip?.name as string) || "Viaje";
  const recipients = await resolveRecipients(opts.tripId, opts.event, opts.origin, opts.participantIds);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const r of recipients) {
    if (!opts.skipDedupe && (await wasRecentlySent(opts.tripId, opts.event, r.email))) {
      skipped += 1;
      await logSend({
        tripId: opts.tripId,
        agencyId: opts.agencyId,
        participantId: r.participantId,
        event: opts.event,
        email: r.email,
        status: "skipped",
        errorMessage: "Ya enviado en las últimas 24 h",
      });
      continue;
    }

    const subject = agencyTravelerEmailSubject({
      agencyName: branding.name,
      tripName,
      event: opts.event,
    });
    const html = buildAgencyTravelerEmailHtml({
      agencyName: branding.name,
      brandColor: branding.brandColor,
      tripName,
      travelerName: r.displayName,
      event: opts.event,
      actionUrl: r.actionUrl,
    });

    const result = await sendTransactionalEmail({ to: r.email, subject, html });

    if (result.sent) {
      sent += 1;
      await logSend({
        tripId: opts.tripId,
        agencyId: opts.agencyId,
        participantId: r.participantId,
        event: opts.event,
        email: r.email,
        status: "sent",
      });
    } else {
      failed += 1;
      const err = result.error || "Error desconocido";
      errors.push(`${r.email}: ${err}`);
      await logSend({
        tripId: opts.tripId,
        agencyId: opts.agencyId,
        participantId: r.participantId,
        event: opts.event,
        email: r.email,
        status: "failed",
        errorMessage: err,
      });
    }
  }

  return {
    sent,
    failed,
    skipped,
    total: recipients.length,
    errors: errors.slice(0, 5),
    noRecipients: recipients.length === 0,
  };
}

export async function sendAllEnabledTripReminders(opts: {
  tripId: string;
  agencyId: string;
  origin: string;
}) {
  const settings = await getTripEmailAutomation(opts.tripId, opts.agencyId);
  const summary: Record<string, Awaited<ReturnType<typeof sendAgencyTripEmailBatch>>> = {};

  for (const event of ["deposit_reminder", "final_reminder", "pretravel_invite", "nps_invite"] as const) {
    if (!eventEnabledForSettings(event, settings)) continue;
    summary[event] = await sendAgencyTripEmailBatch({
      tripId: opts.tripId,
      agencyId: opts.agencyId,
      event,
      origin: opts.origin,
    });
  }

  return { settings, summary };
}
