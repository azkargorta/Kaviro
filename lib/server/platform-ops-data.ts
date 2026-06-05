import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function listPlatformAgencies() {
  const admin = createSupabaseAdmin();
  const { data: agencies, error } = await admin
    .from("agencies")
    .select("id, name, slug, plan, contact_email, max_members, created_at, owner_id")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = agencies ?? [];
  const ids = rows.map((a) => a.id as string);
  const ownerIds = [...new Set(rows.map((a) => a.owner_id as string))];

  const tripCount: Record<string, number> = {};
  const memberCount: Record<string, number> = {};
  const clientCount: Record<string, number> = {};

  if (ids.length) {
    const [{ data: trips }, { data: members }, { data: clients }] = await Promise.all([
      admin.from("trips").select("agency_id").in("agency_id", ids),
      admin.from("agency_members").select("agency_id").in("agency_id", ids),
      admin.from("agency_clients").select("agency_id").in("agency_id", ids),
    ]);

    for (const t of trips ?? []) {
      const aid = t.agency_id as string;
      if (aid) tripCount[aid] = (tripCount[aid] ?? 0) + 1;
    }
    for (const m of members ?? []) {
      const aid = m.agency_id as string;
      memberCount[aid] = (memberCount[aid] ?? 0) + 1;
    }
    for (const c of clients ?? []) {
      const aid = c.agency_id as string;
      clientCount[aid] = (clientCount[aid] ?? 0) + 1;
    }
  }

  const ownerLabel: Record<string, string> = {};
  if (ownerIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", ownerIds);
    for (const p of profiles ?? []) {
      ownerLabel[p.id as string] =
        (p.display_name as string) || (p.username as string) || (p.id as string).slice(0, 8);
    }
  }

  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    plan: a.plan,
    contactEmail: a.contact_email,
    maxMembers: a.max_members,
    createdAt: a.created_at,
    ownerId: a.owner_id,
    ownerLabel: ownerLabel[a.owner_id as string] ?? "—",
    tripCount: tripCount[a.id as string] ?? 0,
    memberCount: (memberCount[a.id as string] ?? 0) + 1,
    clientCount: clientCount[a.id as string] ?? 0,
  }));
}

export async function getPlatformAgencyDetail(agencyId: string) {
  const admin = createSupabaseAdmin();
  const { data: agency, error } = await admin
    .from("agencies")
    .select(
      "id, name, slug, plan, contact_email, logo_url, brand_color, max_members, created_at, owner_id, billing_monthly_amount_cents, billing_currency, stripe_price_id_monthly, billing_quote_notes"
    )
    .eq("id", agencyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!agency) return null;

  const [{ data: trips }, { data: members }, { data: notes }] = await Promise.all([
    admin
      .from("trips")
      .select("id, name, destination, start_date, end_date, agency_sales_status, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("agency_members").select("user_id, role, created_at").eq("agency_id", agencyId),
    admin
      .from("platform_crm_notes")
      .select("id, body, author_user_id, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id as string))];
  const authorIds = [...new Set((notes ?? []).map((n) => n.author_user_id as string))];
  const allProfileIds = [...new Set([...userIds, agency.owner_id as string, ...authorIds])];

  const labels: Record<string, string> = {};
  if (allProfileIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", allProfileIds);
    for (const p of profiles ?? []) {
      labels[p.id as string] =
        (p.display_name as string) || (p.username as string) || (p.id as string).slice(0, 8);
    }
  }

  let emailLogCount = 0;
  const emailRes = await admin
    .from("agency_email_log")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);
  if (!emailRes.error) emailLogCount = emailRes.count ?? 0;

  return {
    agency: {
      ...agency,
      ownerLabel: labels[agency.owner_id as string] ?? "—",
    },
    trips: trips ?? [],
    members: (members ?? []).map((m) => ({
      userId: m.user_id,
      role: m.role,
      label: labels[m.user_id as string] ?? m.user_id,
      createdAt: m.created_at,
    })),
    notes: (notes ?? []).map((n) => ({
      id: n.id,
      body: n.body,
      authorLabel: labels[n.author_user_id as string] ?? "Admin",
      createdAt: n.created_at,
    })),
    stats: {
      tripCount: trips?.length ?? 0,
      emailLogCount,
    },
  };
}

export async function listPlatformLeads(statusFilter?: string) {
  const admin = createSupabaseAdmin();
  let q = admin
    .from("platform_agency_leads")
    .select("id, contact_name, agency_name, email, groups_per_year, message, status, agency_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertPlatformLead(input: {
  contactName: string;
  agencyName: string;
  email: string;
  groupsPerYear: string | null;
  message: string | null;
}) {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("platform_agency_leads")
    .insert({
      contact_name: input.contactName,
      agency_name: input.agencyName,
      email: input.email,
      groups_per_year: input.groupsPerYear,
      message: input.message,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
}

export async function opsOverviewCounts() {
  const admin = createSupabaseAdmin();
  const [{ count: agencies }, { count: tripsB2b }, leadsResult] = await Promise.all([
    admin.from("agencies").select("id", { count: "exact", head: true }),
    admin.from("trips").select("id", { count: "exact", head: true }).not("agency_id", "is", null),
    admin.from("platform_agency_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const leadsMigration = Boolean(leadsResult.error?.message.includes("platform_agency_leads"));

  return {
    agencies: agencies ?? 0,
    leadsNew: leadsMigration ? 0 : leadsResult.count ?? 0,
    tripsB2b: tripsB2b ?? 0,
    needsMigration: leadsMigration,
  };
}
