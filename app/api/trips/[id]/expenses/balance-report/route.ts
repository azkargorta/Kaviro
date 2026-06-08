import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTripAccessForApi } from "@/lib/trip-access";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params;
  const supabase = await createClient();
  const access = await getTripAccessForApi(supabase, tripId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { data: trip } = await supabase.from("trips").select("name, base_currency").eq("id", tripId).maybeSingle();
  const currency = (trip?.base_currency as string) || "EUR";

  const { data: settlements } = await supabase
    .from("trip_expense_settlements")
    .select("debtor_name, creditor_name, amount, currency, status")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  const { data: expenses } = await supabase
    .from("trip_expenses")
    .select("title, amount, currency, category")
    .eq("trip_id", tripId);

  const byCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    const cat = String(e.category || "general");
    byCategory.set(cat, (byCategory.get(cat) || 0) + Number(e.amount) || 0);
  }

  const total = (expenses ?? []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const rows = (settlements ?? [])
    .map(
      (s) =>
        `<tr><td>${esc(String(s.debtor_name))}</td><td>${esc(String(s.creditor_name))}</td><td>${money(Number(s.amount), String(s.currency || currency))}</td><td>${s.status === "paid" ? "Pagado" : "Pendiente"}</td></tr>`
    )
    .join("");

  const catRows = [...byCategory.entries()]
    .map(([cat, amt]) => `<tr><td>${esc(cat)}</td><td>${money(amt, currency)}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Balances — ${esc(String(trip?.name || "Viaje"))}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#111}
h1{font-size:1.5rem}table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #ddd;padding:.5rem;text-align:left}
th{background:#f8fafc}@media print{body{margin:0}}</style></head><body>
<h1>${esc(String(trip?.name || "Viaje"))}</h1>
<p>Informe de balances · ${new Date().toLocaleDateString("es-ES")}</p>
<h2>Quién debe a quién</h2>
<table><thead><tr><th>Debe</th><th>A</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${rows || "<tr><td colspan=4>Sin liquidaciones</td></tr>"}</tbody></table>
<h2>Resumen por categoría</h2>
<table><thead><tr><th>Categoría</th><th>Total</th></tr></thead><tbody>${catRows || "<tr><td colspan=2>Sin gastos</td></tr>"}</tbody></table>
<p><strong>Total gastos:</strong> ${money(total, currency)}</p>
<script>window.onload=()=>window.print()</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
