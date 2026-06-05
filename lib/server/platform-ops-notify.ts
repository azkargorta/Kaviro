import { AGENCY_PARTNERSHIP_EMAIL, KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { sendTransactionalEmail } from "@/lib/email/send-transactional-email";
import { getAppUrl } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/server/user-notifications";
import { logger } from "@/lib/logger";

type Admin = ReturnType<typeof createSupabaseAdmin>;

function adminEmailsFromEnv(): string[] {
  const raw = process.env.KAVIRO_ADMIN_EMAILS || process.env.TRIPBOARD_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function resolvePlatformAdminRecipients(admin: Admin): Promise<{
  userIds: string[];
  emails: string[];
}> {
  const userIds = new Set<string>();
  const emails = new Set<string>();

  for (const e of adminEmailsFromEnv()) emails.add(e);
  emails.add(AGENCY_PARTNERSHIP_EMAIL.trim().toLowerCase());

  const { data: platformAdmins } = await admin.from("platform_admins").select("user_id");
  for (const row of platformAdmins ?? []) {
    const id = row.user_id as string | undefined;
    if (id) userIds.add(id);
  }

  const profileIds = [...userIds];
  if (profileIds.length) {
    const { data: byId } = await admin.from("profiles").select("id, email").in("id", profileIds);
    for (const p of byId ?? []) {
      const mail = (p.email as string | null)?.trim().toLowerCase();
      if (mail) emails.add(mail);
    }
  }

  for (const email of adminEmailsFromEnv()) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profile?.id) userIds.add(profile.id as string);
  }

  return { userIds: [...userIds], emails: [...emails] };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function opsAgencyUrl(agencyId: string): string {
  const base = getAppUrl() || "https://kaviro.app";
  return `${base}/ops/agencies/${agencyId}`;
}

/** Avisa a admins de plataforma (campana + email) cuando una agencia se registra en trial. */
export async function notifyPlatformAdminsNewAgency(
  admin: Admin,
  input: {
    agencyId: string;
    agencyName: string;
    slug: string;
    contactEmail?: string | null;
    ownerEmail?: string | null;
  }
): Promise<void> {
  try {
    const { userIds, emails } = await resolvePlatformAdminRecipients(admin);
    const contact = input.contactEmail || input.ownerEmail || "—";
    const title = "Nueva agencia en prueba";
    const body = `${input.agencyName} (${input.slug}) · ${contact}`;
    const url = `/ops/agencies/${input.agencyId}`;

    await Promise.all(
      userIds.map((userId) =>
        createUserNotification(admin, {
          userId,
          type: "generic",
          title,
          body,
          url,
        })
      )
    );

    const opsUrl = opsAgencyUrl(input.agencyId);
    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:24px;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">${KAVIRO_TRIPS_PRODUCT_NAME} · Ops</p>
    <h1 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Nueva agencia registrada</h1>
    <p style="margin:0 0 8px;color:#334155;"><strong>Agencia:</strong> ${escapeHtml(input.agencyName)}</p>
    <p style="margin:0 0 8px;color:#334155;"><strong>Slug:</strong> ${escapeHtml(input.slug)}</p>
    <p style="margin:0 0 16px;color:#334155;"><strong>Contacto:</strong> ${escapeHtml(contact)}</p>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Asigna la tarifa mensual en Ops antes de que activen Agency Pro.</p>
    <a href="${opsUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">Abrir ficha en Ops</a>
  </div>
</body>
</html>`;

    await Promise.all(
      emails.map((to) =>
        sendTransactionalEmail({
          to,
          subject: `Nueva agencia ${KAVIRO_TRIPS_PRODUCT_NAME} — ${input.agencyName}`,
          html,
        })
      )
    );
  } catch (e) {
    logger.warn("notifyPlatformAdminsNewAgency:", e);
  }
}

/** Notifica al owner de la agencia que ya puede activar Agency Pro. */
export async function notifyAgencyOwnerPricingReady(
  admin: Admin,
  input: {
    ownerId: string;
    agencyName: string;
    quoteLabel: string;
  }
): Promise<void> {
  try {
    await createUserNotification(admin, {
      userId: input.ownerId,
      type: "generic",
      title: "Tu tarifa Agency Pro está lista",
      body: `${input.agencyName}: ${input.quoteLabel}/mes. Ya puedes activar el plan en Plan y facturación.`,
      url: "/agency/plan",
    });
  } catch (e) {
    logger.warn("notifyAgencyOwnerPricingReady:", e);
  }
}
