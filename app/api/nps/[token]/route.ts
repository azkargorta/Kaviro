import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";

type Params = { params: { token: string } };

export async function GET(_req: Request, { params }: Params) {
  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("agency_nps_responses")
    .select("trip_id, traveler_label, submitted_at, nps_score")
    .eq("token", params.token)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });

  const { data: trip } = await admin.from("trips").select("name, agency_id").eq("id", row.trip_id).maybeSingle();
  let branding = agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);
  if (trip?.agency_id) {
    const { data: agency } = await admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", trip.agency_id)
      .maybeSingle();
    if (agency) branding = agencyBrandingFromRow(agency as AgencyRow);
  }

  return NextResponse.json({
    tripName: trip?.name,
    travelerLabel: row.traveler_label,
    submitted: Boolean(row.submitted_at),
    branding,
  });
}

export async function POST(req: Request, { params }: Params) {
  const body = await req.json().catch(() => ({}));
  const nps = Number(body?.npsScore);
  if (!Number.isFinite(nps) || nps < 0 || nps > 10) {
    return NextResponse.json({ error: "NPS debe ser 0-10." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const patch = {
    nps_score: Math.round(nps),
    rating_hotel: clamp15(body?.ratingHotel),
    rating_transport: clamp15(body?.ratingTransport),
    rating_activities: clamp15(body?.ratingActivities),
    rating_organization: clamp15(body?.ratingOrganization),
    rating_value: clamp15(body?.ratingValue),
    comment: typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : null,
    allow_testimonial: Boolean(body?.allowTestimonial),
    submitted_at: new Date().toISOString(),
  };

  const { error } = await admin.from("agency_nps_responses").update(patch).eq("token", params.token);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

function clamp15(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}
