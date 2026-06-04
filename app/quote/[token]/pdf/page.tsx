import { notFound } from "next/navigation";
import PrintOnLoad from "@/app/share/[token]/pdf/PrintOnLoad";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import { computeQuoteTotals, QUOTE_CATEGORY_LABELS } from "@/lib/agency/quotes";

type Props = { params: { token: string } };

function formatMoney(n: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(n);
}

export default async function QuotePdfPage({ params }: Props) {
  const admin = createSupabaseAdmin();
  const { data: quote } = await admin
    .from("agency_trip_quotes")
    .select("*")
    .eq("accept_token", params.token)
    .maybeSingle();

  if (!quote || !quote.accept_token) notFound();

  const [{ data: lines }, { data: trip }, { data: agency }] = await Promise.all([
    admin.from("agency_quote_line_items").select("*").eq("quote_id", quote.id).order("sort_order"),
    admin.from("trips").select("name, destination, start_date, end_date").eq("id", quote.trip_id).maybeSingle(),
    admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", quote.agency_id)
      .maybeSingle(),
  ]);

  const currency = (quote.currency as string) || "EUR";
  const totals = computeQuoteTotals({
    lines: lines ?? [],
    travelersCount: quote.travelers_count != null ? Number(quote.travelers_count) : null,
    discountPercent: Number(quote.discount_percent) || 0,
  });

  const branding = agency
    ? agencyBrandingFromRow(agency as AgencyRow)
    : agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);

  const accent = branding.brandColor;

  return (
    <main style={{ background: "#fff", color: "#0f172a", fontFamily: "Georgia, serif" }}>
      <PrintOnLoad />
      <style>{`
        @page { size: A4; margin: 18mm; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { padding: 8px 4px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        .num { text-align: right; }
      `}</style>

      <header style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#64748b" }}>
          {branding.name}
        </p>
        <h1 style={{ fontSize: 22, margin: "8px 0", color: accent }}>{quote.title}</h1>
        {quote.client_label ? <p style={{ fontSize: 13 }}>{quote.client_label}</p> : null}
        {trip ? (
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {trip.name}
            {trip.destination ? ` · ${trip.destination}` : ""}
          </p>
        ) : null}
        {quote.valid_until ? (
          <p style={{ fontSize: 11, color: "#94a3b8" }}>Válido hasta {quote.valid_until}</p>
        ) : null}
      </header>

      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Importe</th>
          </tr>
        </thead>
        <tbody>
          {(lines ?? []).map((l) => (
            <tr key={l.id as string}>
              <td>
                <strong>{l.label}</strong>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {QUOTE_CATEGORY_LABELS[l.category as keyof typeof QUOTE_CATEGORY_LABELS]}
                </div>
              </td>
              <td className="num">
                {formatMoney(Number(l.unit_amount) * Number(l.quantity), currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24, fontSize: 13, maxWidth: 280, marginLeft: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotal, currency)}</span>
        </div>
        {totals.discountAmount > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
            <span>Descuento</span>
            <span>-{formatMoney(totals.discountAmount, currency)}</span>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 16, marginTop: 8 }}>
          <span>Total</span>
          <span>{formatMoney(totals.total, currency)}</span>
        </div>
        {totals.pricePerPerson != null ? (
          <p style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
            {formatMoney(totals.pricePerPerson, currency)} por persona
          </p>
        ) : null}
      </div>

      {quote.notes ? (
        <p style={{ marginTop: 24, fontSize: 11, color: "#64748b", whiteSpace: "pre-wrap" }}>{quote.notes}</p>
      ) : null}

      <footer style={{ marginTop: 40, fontSize: 10, color: "#94a3b8" }}>
        Presupuesto emitido por {branding.name}. Condiciones sujetas a disponibilidad.
      </footer>
    </main>
  );
}
