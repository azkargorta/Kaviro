import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTripAccessForApi } from "@/lib/trip-access";
import { buildBalances, buildSettlementSuggestions, type TripExpenseBalanceInput } from "@/lib/expense-balance";
import { expenseCategoryLabel } from "@/lib/expense-categories";

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

  const [{ data: storedSettlements }, { data: expenses }] = await Promise.all([
    supabase
      .from("trip_expense_settlements")
      .select("debtor_name, creditor_name, amount, currency, status, source_balance_key")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true }),
    supabase
      .from("trip_expenses")
      .select(
        "amount, currency, category, payer_name, participant_names, paid_by_names, owed_by_names, owed_amounts, paid_amounts"
      )
      .eq("trip_id", tripId),
  ]);

  const balanceExpenses: TripExpenseBalanceInput[] = (expenses ?? []).map((e) => ({
    id: "",
    amount: Number(e.amount) || 0,
    currency,
    payer_name: typeof e.payer_name === "string" ? e.payer_name : "",
    participant_names: e.participant_names,
    paid_by_names: e.paid_by_names,
    owed_by_names: e.owed_by_names,
    owed_amounts: e.owed_amounts,
    paid_amounts: e.paid_amounts,
  }));

  const existingByKey = new Map(
    (storedSettlements ?? []).map((item) => [
      item.source_balance_key || `${item.debtor_name}->${item.creditor_name}`,
      item,
    ])
  );

  const balances = buildBalances(balanceExpenses);

  const settlements = buildSettlementSuggestions(balances, currency).map((suggestion) => {
    const existing = existingByKey.get(suggestion.source_balance_key);
    return existing
      ? { ...suggestion, status: existing.status === "paid" ? ("paid" as const) : ("pending" as const) }
      : suggestion;
  });

  const byCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    const catKey = String(e.category || "general").trim().toLowerCase() || "general";
    byCategory.set(catKey, (byCategory.get(catKey) || 0) + (Number(e.amount) || 0));
  }

  const total = (expenses ?? []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const balanceRows = balances
    .map((row) => {
      const bal = Number(row.balance) || 0;
      const status =
        Math.abs(bal) < 0.01
          ? "Cuadrado"
          : bal > 0
            ? `Le deben ${money(bal, currency)}`
            : `Debe ${money(Math.abs(bal), currency)}`;
      return `<tr><td>${esc(String(row.person))}</td><td>${money(Number(row.paid), currency)}</td><td>${money(Number(row.owed), currency)}</td><td>${money(bal, currency)}</td><td>${esc(status)}</td></tr>`;
    })
    .join("");

  const settlementRows = settlements
    .map(
      (s) =>
        `<tr><td>${esc(String(s.debtor_name))}</td><td>${esc(String(s.creditor_name))}</td><td>${money(Number(s.amount), String(s.currency || currency))}</td><td>${s.status === "paid" ? "Pagado" : "Pendiente"}</td></tr>`
    )
    .join("");

  const catRows = [...byCategory.entries()]
    .sort((a, b) => expenseCategoryLabel(a[0]).localeCompare(expenseCategoryLabel(b[0]), "es"))
    .map(([cat, amt]) => `<tr><td>${esc(expenseCategoryLabel(cat))}</td><td>${money(amt, currency)}</td></tr>`)
    .join("");

  const backHref = `/trip/${encodeURIComponent(tripId)}/expenses`;
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Balances — ${esc(String(trip?.name || "Viaje"))}</title>
<style>
*{box-sizing:border-box}
body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:0 1rem 2rem;color:#111;padding-top:env(safe-area-inset-top,0)}
.toolbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:.75rem;margin:0 -1rem 1rem;padding:.75rem 1rem;padding-top:max(.75rem,env(safe-area-inset-top));background:#0f172a;color:#fff;box-shadow:0 2px 12px rgba(15,23,42,.15)}
.toolbar a{color:#fff;text-decoration:none;font-weight:700;font-size:.9rem}
.toolbar button{margin-left:auto;border:0;border-radius:.5rem;background:#f87171;color:#fff;font-weight:700;font-size:.85rem;padding:.5rem .85rem;cursor:pointer}
h1{font-size:1.35rem;margin-top:.5rem}h2{font-size:1.05rem;margin:1.25rem 0 .35rem}.muted{color:#64748b;font-size:.85rem;margin:.25rem 0 .75rem}table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.9rem}th,td{border:1px solid #ddd;padding:.5rem;text-align:left}
th{background:#f8fafc}@media print{.toolbar{display:none!important}body{margin:0;padding-top:0}}
</style></head><body>
<div class="toolbar no-print">
  <a href="${backHref}" id="back-link">← Volver a gastos</a>
  <button type="button" onclick="window.print()">Imprimir / PDF</button>
</div>
<h1>${esc(String(trip?.name || "Viaje"))}</h1>
<p>Informe de balances · ${new Date().toLocaleDateString("es-ES")}</p>
<h2>Balance por persona (${balances.length} viajeros)</h2>
<table><thead><tr><th>Persona</th><th>Ha pagado</th><th>Le corresponde</th><th>Balance</th><th>Estado</th></tr></thead><tbody>${balanceRows || "<tr><td colspan=5>Sin gastos registrados</td></tr>"}</tbody></table>
<h2>Pagos a realizar</h2>
<p class="muted">Liquidación simplificada: el mínimo de transferencias para saldar el grupo.</p>
<table><thead><tr><th>Debe</th><th>A</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${settlementRows || "<tr><td colspan=4>Sin pagos pendientes</td></tr>"}</tbody></table>
<h2>Resumen por categoría</h2>
<table><thead><tr><th>Categoría</th><th>Total</th></tr></thead><tbody>${catRows || "<tr><td colspan=2>Sin gastos</td></tr>"}</tbody></table>
<p><strong>Total gastos:</strong> ${money(total, currency)}</p>
<script>
(function(){
  var back=document.getElementById("back-link");
  if(back){back.addEventListener("click",function(e){
    if(window.history.length>1){e.preventDefault();window.history.back();}
  });}
  var mobile=/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent)||window.innerWidth<768;
  if(!mobile){window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});}
})();
</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
