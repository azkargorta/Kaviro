import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { computeQuoteTotals, DEFAULT_QUOTE_LINE_TEMPLATE } from "@/lib/agency/quotes";

type Params = { params: { tripId: string } };

function migrationResponse() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_quotes.sql" });
}

function isMigrationError(msg: string) {
  return msg.includes("agency_trip_quotes") || msg.includes("agency_quote_line") || msg.includes("agency_sales_status");
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: trip } = await gate.supabase
    .from("trips")
    .select("name, agency_sales_status, max_capacity")
    .eq("id", params.tripId)
    .maybeSingle();

  const { data: quotes, error } = await gate.supabase
    .from("agency_trip_quotes")
    .select(
      "id, title, client_label, currency, price_per_person, total_price, travelers_count, valid_until, discount_percent, status, accept_token, accepted_at, created_at, updated_at"
    )
    .eq("trip_id", params.tripId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMigrationError(error.message)) return migrationResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tripName: trip?.name,
    salesStatus: trip?.agency_sales_status ?? "draft",
    maxCapacity: trip?.max_capacity ?? null,
    quotes: quotes ?? [],
  });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim()
      : `Presupuesto — ${gate.trip.name || "Viaje"}`;
  const travelersCount =
    body?.travelersCount != null && body.travelersCount !== ""
      ? Math.max(1, Math.round(Number(body.travelersCount)))
      : null;
  const validUntil = typeof body?.validUntil === "string" ? body.validUntil.slice(0, 10) : null;

  const admin = createSupabaseAdmin();

  try {
    const { data: quote, error: qErr } = await admin
      .from("agency_trip_quotes")
      .insert({
        trip_id: params.tripId,
        agency_id: gate.ctx.agency.id,
        title,
        client_label: typeof body?.clientLabel === "string" ? body.clientLabel.trim() : null,
        travelers_count: travelersCount,
        valid_until: validUntil,
        currency: "EUR",
        status: "draft",
        created_by: gate.user.id,
      })
      .select("id")
      .single();

    if (qErr) throw qErr;

    const lines = DEFAULT_QUOTE_LINE_TEMPLATE.map((l, i) => ({
      quote_id: quote.id,
      category: l.category,
      label: l.label,
      unit_amount: l.unit_amount,
      quantity: l.quantity,
      sort_order: i,
    }));

    await admin.from("agency_quote_line_items").insert(lines);

    const totals = computeQuoteTotals({
      lines,
      travelersCount,
      discountPercent: 0,
    });

    await admin
      .from("agency_trip_quotes")
      .update({
        total_price: totals.total,
        price_per_person: totals.pricePerPerson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    await admin
      .from("trips")
      .update({ agency_sales_status: "proposal", updated_at: new Date().toISOString() })
      .eq("id", params.tripId)
      .eq("agency_id", gate.ctx.agency.id);

    return NextResponse.json({ quoteId: quote.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigrationError(msg)) return migrationResponse();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
