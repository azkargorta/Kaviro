import { notFound } from "next/navigation";
import QuotePublicView from "@/components/quote/QuotePublicView";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import { computeQuoteTotals, isQuoteExpired, QUOTE_CATEGORY_LABELS } from "@/lib/agency/quotes";

type Props = { params: { token: string } };

export default async function QuotePublicPage({ params }: Props) {
  const admin = createSupabaseAdmin();
  const { data: quote } = await admin
    .from("agency_trip_quotes")
    .select("*")
    .eq("accept_token", params.token)
    .maybeSingle();

  if (!quote || quote.status === "draft") notFound();
  if (quote.status === "accepted") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-600">Este presupuesto ya fue aceptado.</p>
      </main>
    );
  }
  if (isQuoteExpired(quote.valid_until as string | null)) notFound();

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

  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-10">
      <QuotePublicView
        token={params.token}
        branding={branding}
        quote={{
          title: quote.title as string,
          clientLabel: quote.client_label as string | null,
          currency: (quote.currency as string) || "EUR",
          validUntil: quote.valid_until as string | null,
          notes: quote.notes as string | null,
          discountPercent: Number(quote.discount_percent) || 0,
          discountLabel: quote.discount_label as string | null,
        }}
        trip={trip}
        lines={(lines ?? []).map((l) => ({
          label: l.label as string,
          categoryLabel:
            QUOTE_CATEGORY_LABELS[l.category as keyof typeof QUOTE_CATEGORY_LABELS] ?? String(l.category),
          description: l.description as string | null,
          unit_amount: Number(l.unit_amount),
          quantity: Number(l.quantity),
        }))}
        totals={totals}
      />
    </main>
  );
}
