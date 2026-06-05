import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyRole = "admin" | "editor";

export type AgencyRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  contact_email: string | null;
  owner_id: string;
  plan: string;
  max_members: number;
  plan_active_until?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export type AgencyMemberRow = {
  agency_id: string;
  user_id: string;
  role: AgencyRole;
};

export type AgencyBranding = {
  name: string;
  logoUrl: string | null;
  brandColor: string;
  contactEmail: string | null;
};

const DEFAULT_BRAND_COLOR = "#1e3a5f";

/** Primera agencia del usuario (miembro o owner). */
export async function getAgencyForUser(
  client: SupabaseClient,
  userId: string
): Promise<{ agency: AgencyRow; membership: AgencyMemberRow } | null> {
  const { data: memberRow, error: memberErr } = await client
    .from("agency_members")
    .select("agency_id, user_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (memberErr) {
    // Sin fila en agency_members: el owner puede seguir accediendo vía owner_id.
    return null;
  }

  let agencyId = memberRow?.agency_id as string | undefined;

  if (!agencyId) {
    const { data: owned } = await client
      .from("agencies")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    agencyId = owned?.id as string | undefined;
  }

  if (!agencyId) return null;

  const { data: agency, error: agencyErr } = await client
    .from("agencies")
    .select(
      "id, name, slug, logo_url, brand_color, contact_email, owner_id, plan, max_members, plan_active_until, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", agencyId)
    .maybeSingle();

  if (agencyErr || !agency) return null;

  const membership: AgencyMemberRow = memberRow
    ? {
        agency_id: memberRow.agency_id as string,
        user_id: memberRow.user_id as string,
        role: (memberRow.role === "admin" ? "admin" : "editor") as AgencyRole,
      }
    : {
        agency_id: agencyId,
        user_id: userId,
        role: "admin",
      };

  return { agency: agency as AgencyRow, membership };
}

export type AgencyTripListRow = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  agency_id: string | null;
  client_portal_slug: string | null;
  created_at: string | null;
  agency_client_id: string | null;
  clientName: string | null;
};

export async function getAgencyTrips(client: SupabaseClient, agencyId: string): Promise<AgencyTripListRow[]> {
  const { data, error } = await client
    .from("trips")
    .select(
      "id, name, destination, start_date, end_date, agency_id, client_portal_slug, created_at, agency_client_id, agency_clients ( name )"
    )
    .eq("agency_id", agencyId)
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("agency_client_id") || error.message.includes("agency_clients")) {
      const { data: fallback, error: fallbackErr } = await client
        .from("trips")
        .select("id, name, destination, start_date, end_date, agency_id, client_portal_slug, created_at")
        .eq("agency_id", agencyId)
        .order("start_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (fallbackErr) throw new Error(fallbackErr.message);
      return (fallback ?? []).map((row) => ({
        ...(row as Omit<AgencyTripListRow, "agency_client_id" | "clientName">),
        agency_client_id: null,
        clientName: null,
      }));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const client = row.agency_clients as { name?: string } | { name?: string }[] | null;
    const clientName = Array.isArray(client) ? client[0]?.name ?? null : client?.name ?? null;
    const { agency_clients: _c, ...rest } = row as Record<string, unknown>;
    return {
      ...(rest as Omit<AgencyTripListRow, "clientName">),
      clientName: clientName?.trim() || null,
    };
  });
}

export async function isAgencyMember(
  client: SupabaseClient,
  agencyId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await client
    .from("agency_members")
    .select("user_id")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  if (data) return true;

  const { data: owned } = await client
    .from("agencies")
    .select("id")
    .eq("id", agencyId)
    .eq("owner_id", userId)
    .maybeSingle();

  return Boolean(owned);
}

export function agencyBrandingFromRow(agency: AgencyRow): AgencyBranding {
  return {
    name: agency.name,
    logoUrl: agency.logo_url,
    brandColor: agency.brand_color?.trim() || DEFAULT_BRAND_COLOR,
    contactEmail: agency.contact_email,
  };
}

export function clientPortalPath(agencySlug: string, tripSlug: string) {
  return `/client/${encodeURIComponent(agencySlug)}/${encodeURIComponent(tripSlug)}`;
}

export { isAgencyPlanActive, agencyPlanLabel } from "@/lib/agency-plan";
