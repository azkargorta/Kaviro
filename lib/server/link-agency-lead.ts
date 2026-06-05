import { createSupabaseAdmin } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createSupabaseAdmin>;

/** Vincula leads de /empresa con la agencia recién creada (mismo email). */
export async function linkPlatformLeadsToAgency(
  admin: Admin,
  input: { agencyId: string; email: string }
): Promise<{ linked: number }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.agencyId) return { linked: 0 };

  const { data: leads, error } = await admin
    .from("platform_agency_leads")
    .select("id, status")
    .ilike("email", email)
    .is("agency_id", null);

  if (error) {
    if (error.message.includes("platform_agency_leads")) return { linked: 0 };
    throw new Error(error.message);
  }

  if (!leads?.length) return { linked: 0 };

  let linked = 0;
  for (const lead of leads) {
    const nextStatus =
      lead.status === "new" || lead.status === "contacted" ? "qualified" : lead.status;
    const { error: updErr } = await admin
      .from("platform_agency_leads")
      .update({
        agency_id: input.agencyId,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (!updErr) linked += 1;
  }

  return { linked };
}

/** Vincula leads históricos sin agency_id (mismo email que contact_email de la agencia). */
export async function backfillPlatformLeadLinks(
  admin: Admin
): Promise<{ scanned: number; linked: number }> {
  const { data: leads, error } = await admin
    .from("platform_agency_leads")
    .select("id, email, status")
    .is("agency_id", null);

  if (error) {
    if (error.message.includes("platform_agency_leads")) return { scanned: 0, linked: 0 };
    throw new Error(error.message);
  }

  if (!leads?.length) return { scanned: 0, linked: 0 };

  let linked = 0;
  for (const lead of leads) {
    const email = (lead.email as string).trim().toLowerCase();
    if (!email) continue;

    const { data: agency } = await admin
      .from("agencies")
      .select("id")
      .ilike("contact_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!agency?.id) continue;

    const result = await linkPlatformLeadsToAgency(admin, {
      agencyId: agency.id as string,
      email,
    });
    linked += result.linked;
  }

  return { scanned: leads.length, linked };
}

export function agencyNeedsPricingSetup(agency: {
  plan?: string | null;
  stripe_price_id_monthly?: string | null;
  billing_monthly_amount_cents?: number | null;
}): boolean {
  if (agency.plan === "partnership" || agency.plan === "agency_pro") return false;
  if (agency.stripe_price_id_monthly?.trim()) return false;
  if (typeof agency.billing_monthly_amount_cents === "number" && agency.billing_monthly_amount_cents > 0) {
    return false;
  }
  return agency.plan === "trial" || agency.plan === "free";
}
