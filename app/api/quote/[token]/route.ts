import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import { computeQuoteTotals, isQuoteExpired, QUOTE_CATEGORY_LABELS } from "@/lib/agency/quotes";

type Params = { params: { token: string } };

export async function GET(_req: Request, { params }: Params) {
  const token = params.token?.trim();
  if (!token) return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: quote, error } = await admin
    .from("agency_trip_quotes")
    .select("*")
    .eq("accept_token", token)
    .maybeSingle();

  if (error?.message.includes("agency_trip_quotes")) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });

  if (quote.status === "accepted") {
    return NextResponse.json({ error: "Esta cotización ya fue aceptada.", alreadyAccepted: true }, { status: 410 });
  }

  if (isQuoteExpired(quote.valid_until as string | null) && quote.status !== "accepted") {
    await admin.from("agency_trip_quotes").update({ status: "expired" }).eq("id", quote.id);
    return NextResponse.json({ error: "Esta oferta ha caducado.", expired: true }, { status: 410 });
  }

  const [{ data: lines }, { data: trip }, { data: agency }] = await Promise.all([
    admin.from("agency_quote_line_items").select("*").eq("quote_id", quote.id).order("sort_order"),
    admin.from("trips").select("name, destination, start_date, end_date").eq("id", quote.trip_id).maybeSingle(),
    admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", quote.agency_id)
      .maybeSingle(),
  ]);

  const totals = computeQuoteTotals({
    lines: lines ?? [],
    travelersCount: quote.travelers_count != null ? Number(quote.travelers_count) : null,
    discountPercent: Number(quote.discount_percent) || 0,
  });

  const branding = agency
    ? agencyBrandingFromRow(agency as AgencyRow)
    : agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);

  return NextResponse.json({
    quote: {
      title: quote.title,
      clientLabel: quote.client_label,
      currency: quote.currency,
      validUntil: quote.valid_until,
      notes: quote.notes,
      discountPercent: quote.discount_percent,
      discountLabel: quote.discount_label,
      status: quote.status,
    },
    trip,
    lines: (lines ?? []).map((l) => ({
      ...l,
      categoryLabel: QUOTE_CATEGORY_LABELS[l.category as keyof typeof QUOTE_CATEGORY_LABELS] ?? l.category,
    })),
    totals,
    branding,
  });
}

export async function POST(req: Request, { params }: Params) {
  const token = params.token?.trim();
  if (!token) return NextResponse.json({ error: "Enlace inválido." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action === "reject" ? "reject" : "accept";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (action === "accept" && (!name || !email || !email.includes("@"))) {
    return NextResponse.json({ error: "Indica nombre y email válidos." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: quote } = await admin
    .from("agency_trip_quotes")
    .select("id, trip_id, agency_id, status, valid_until")
    .eq("accept_token", token)
    .maybeSingle();

  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (quote.status === "accepted") {
    return NextResponse.json({ ok: true, alreadyAccepted: true });
  }
  if (isQuoteExpired(quote.valid_until as string | null)) {
    return NextResponse.json({ error: "Oferta caducada." }, { status: 410 });
  }

  if (action === "reject") {
    await admin
      .from("agency_trip_quotes")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", quote.id);
    return NextResponse.json({ ok: true, rejected: true });
  }

  await admin
    .from("agency_trip_quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_name: name,
      accepted_by_email: email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  await admin
    .from("trips")
    .update({ agency_sales_status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", quote.trip_id);

  return NextResponse.json({ ok: true, accepted: true });
}
