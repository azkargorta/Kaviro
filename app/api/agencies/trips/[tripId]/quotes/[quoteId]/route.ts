import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  computeQuoteTotals,
  generateQuoteAcceptToken,
  QUOTE_LINE_CATEGORIES,
  type QuoteLineCategory,
} from "@/lib/agency/quotes";

type Params = { params: { tripId: string; quoteId: string } };

function migrationResponse() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_quotes.sql" });
}

function isMigrationError(msg: string) {
  return msg.includes("agency_trip_quotes") || msg.includes("agency_quote_line");
}

async function loadQuoteDetail(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  tripId: string,
  quoteId: string
) {
  const { data: quote, error } = await supabase
    .from("agency_trip_quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) throw error;
  if (!quote) return null;

  const { data: lines } = await supabase
    .from("agency_quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  const totals = computeQuoteTotals({
    lines: lines ?? [],
    travelersCount: quote.travelers_count != null ? Number(quote.travelers_count) : null,
    discountPercent: Number(quote.discount_percent) || 0,
  });

  return { quote, lines: lines ?? [], totals };
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const detail = await loadQuoteDetail(gate.supabase, params.tripId, params.quoteId);
    if (!detail) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigrationError(msg)) return migrationResponse();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdmin();

  try {
    const { data: current } = await gate.supabase
      .from("agency_trip_quotes")
      .select("status, accept_token")
      .eq("id", params.quoteId)
      .eq("trip_id", params.tripId)
      .maybeSingle();

    if (!current) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
    if (current.status === "accepted") {
      return NextResponse.json({ error: "La cotización ya fue aceptada." }, { status: 409 });
    }

    const quotePatch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body?.title === "string") quotePatch.title = body.title.trim();
    if (body?.clientLabel !== undefined) {
      quotePatch.client_label = body.clientLabel ? String(body.clientLabel).trim() : null;
    }
    if (body?.travelersCount !== undefined) {
      const n = body.travelersCount === null || body.travelersCount === "" ? null : Math.max(1, Math.round(Number(body.travelersCount)));
      quotePatch.travelers_count = n;
    }
    if (body?.validUntil !== undefined) {
      quotePatch.valid_until = body.validUntil ? String(body.validUntil).slice(0, 10) : null;
    }
    if (body?.discountPercent !== undefined) {
      quotePatch.discount_percent = Math.min(100, Math.max(0, Number(body.discountPercent) || 0));
    }
    if (typeof body?.discountLabel === "string") quotePatch.discount_label = body.discountLabel.trim() || null;
    if (typeof body?.notes === "string") quotePatch.notes = body.notes.trim() || null;

    if (body?.status === "sent") {
      quotePatch.status = "sent";
      if (!current.accept_token) quotePatch.accept_token = generateQuoteAcceptToken();
    }
    if (body?.status === "draft") quotePatch.status = "draft";

    if (Array.isArray(body?.lines)) {
      await admin.from("agency_quote_line_items").delete().eq("quote_id", params.quoteId);
      const rows = body.lines
        .map((line: Record<string, unknown>, i: number) => {
          const cat = String(line.category ?? "other");
          const category = QUOTE_LINE_CATEGORIES.includes(cat as QuoteLineCategory)
            ? (cat as QuoteLineCategory)
            : "other";
          const label = String(line.label ?? "").trim();
          if (!label) return null;
          return {
            quote_id: params.quoteId,
            category,
            label,
            description: line.description ? String(line.description).trim() : null,
            unit_amount: Math.max(0, Number(line.unit_amount) || 0),
            quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
            sort_order: i,
          };
        })
        .filter(Boolean);

      if (rows.length) await admin.from("agency_quote_line_items").insert(rows);
    }

    await admin.from("agency_trip_quotes").update(quotePatch).eq("id", params.quoteId);

    const detail = await loadQuoteDetail(gate.supabase, params.tripId, params.quoteId);
    if (!detail) return NextResponse.json({ error: "Error al recargar." }, { status: 500 });

    await admin
      .from("agency_trip_quotes")
      .update({
        total_price: detail.totals.total,
        price_per_person: detail.totals.pricePerPerson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.quoteId);

    if (body?.status === "sent") {
      await admin
        .from("trips")
        .update({ agency_sales_status: "proposal" })
        .eq("id", params.tripId);
    }

    const refreshed = await loadQuoteDetail(gate.supabase, params.tripId, params.quoteId);
    return NextResponse.json(refreshed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigrationError(msg)) return migrationResponse();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data } = await gate.supabase
    .from("agency_trip_quotes")
    .select("status")
    .eq("id", params.quoteId)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (data.status === "accepted") {
    return NextResponse.json({ error: "No se puede borrar una cotización aceptada." }, { status: 409 });
  }

  const { error } = await gate.supabase.from("agency_trip_quotes").delete().eq("id", params.quoteId);
  if (error) {
    if (isMigrationError(error.message)) return migrationResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
