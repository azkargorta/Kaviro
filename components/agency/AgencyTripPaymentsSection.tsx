"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCopy, CreditCard, Download, Loader2 } from "lucide-react";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyInputClass,
  agencyLabelClass,
} from "@/lib/agency-theme";
import {
  PAYMENT_OVERALL_COLORS,
  PAYMENT_OVERALL_LABELS,
  formatMoney,
} from "@/lib/agency/payments";
import { useToast } from "@/components/ui/toast";

type RosterRow = {
  participantId: string;
  displayName: string | null;
  email: string | null;
  payment: {
    depositPayUrl: string | null;
    finalPayUrl: string | null;
    summary: { overall: keyof typeof PAYMENT_OVERALL_LABELS };
  } | null;
};

type Settings = {
  pricePerPerson: number | null;
  depositPercent: number;
  depositDueDate: string | null;
  finalDueDate: string | null;
  currency: string;
};

export default function AgencyTripPaymentsSection({
  tripId,
  showEmailHint = false,
}: {
  tripId: string;
  showEmailHint?: boolean;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [totals, setTotals] = useState({ collected: 0, pending: 0, counts: { pending: 0, deposit_paid: 0, paid: 0, cancelled: 0 } });
  const [priceInput, setPriceInput] = useState("");
  const [depositPct, setDepositPct] = useState("30");
  const [depositDue, setDepositDue] = useState("");
  const [finalDue, setFinalDue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      const s = data.settings as Settings;
      setSettings(s);
      setRoster(data.roster ?? []);
      setTotals(data.totals ?? { collected: 0, pending: 0, counts: {} });
      setPriceInput(s.pricePerPerson != null ? String(s.pricePerPerson) : "");
      setDepositPct(String(s.depositPercent ?? 30));
      setDepositDue(s.depositDueDate?.slice(0, 10) ?? "");
      setFinalDue(s.finalDueDate?.slice(0, 10) ?? "");
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerPerson: priceInput === "" ? null : Number(priceInput),
          depositPercent: Number(depositPct),
          depositDueDate: depositDue || null,
          finalDueDate: finalDue || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      setRoster(data.roster ?? []);
      setTotals(data.totals);
      toast.push({ kind: "success", title: "Tarifas guardadas" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function sendDueReminders() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments/remind-due`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBefore: 2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.push({
        kind: "success",
        title: "Recordatorios enviados",
        description: `${data.sent ?? 0} correo(s) · ${data.skipped ?? 0} omitido(s)`,
      });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function syncPayments() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      toast.push({
        kind: "success",
        title: data.created > 0 ? `${data.created} enlace(s) creado(s)` : "Enlaces al día",
      });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      toast.push({ kind: "success", title: "Enlace copiado" });
    } catch {
      toast.push({ kind: "error", title: "No se pudo copiar" });
    }
  }

  if (loading) return <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />;
  if (needsMigration) {
    return (
      <p className="text-sm text-amber-800">
        Ejecuta <code>docs/kaviro_agency_payments.sql</code> en Supabase y configura Stripe en el servidor.
      </p>
    );
  }

  const currency = settings?.currency ?? "EUR";
  const hasPrice = settings?.pricePerPerson != null && Number(settings.pricePerPerson) > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Cobro en dos fases (señal + pago final) con Stripe Checkout. Los viajeros pagan desde un enlace único.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className={agencyLabelClass}>Precio / persona</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className={`${agencyInputClass} mt-1`}
            placeholder="Ej. 1200"
          />
        </label>
        <label className="block">
          <span className={agencyLabelClass}>Señal (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={depositPct}
            onChange={(e) => setDepositPct(e.target.value)}
            className={`${agencyInputClass} mt-1 w-24`}
          />
        </label>
        <label className="block">
          <span className={agencyLabelClass}>Vencimiento señal</span>
          <input
            type="date"
            value={depositDue}
            onChange={(e) => setDepositDue(e.target.value)}
            className={`${agencyInputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className={agencyLabelClass}>Vencimiento final</span>
          <input
            type="date"
            value={finalDue}
            onChange={(e) => setFinalDue(e.target.value)}
            className={`${agencyInputClass} mt-1`}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void saveSettings()} className={agencyBtnPrimaryClass}>
          Guardar tarifas
        </button>
        {hasPrice ? (
          <button type="button" disabled={busy} onClick={() => void syncPayments()} className={agencyBtnSecondaryClass}>
            Generar enlaces de pago
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || !hasPrice}
          onClick={() => void sendDueReminders()}
          className={agencyBtnSecondaryClass}
          title="Envía email a quienes vencen en 2 días (señal o pago final)"
        >
          Recordatorio (−2 días)
        </button>
        <a
          href={`/api/agencies/trips/${tripId}/payments/export`}
          className={`${agencyBtnSecondaryClass} inline-flex items-center gap-1`}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </a>
      </div>

      {showEmailHint ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          Define las fechas de vencimiento arriba. El botón «Recordatorio (−2 días)» avisa por correo a quienes
          deben pagar dentro de dos días. Para automatizar más eventos, usa Operaciones → Emails.
        </p>
      ) : null}

      {hasPrice ? (
        <p className="text-xs text-slate-500">
          Cobrado: <strong>{formatMoney(totals.collected, currency)}</strong> · Pendiente:{" "}
          <strong>{formatMoney(totals.pending, currency)}</strong> · Pagados: {totals.counts.paid} /{" "}
          {roster.length}
        </p>
      ) : null}

      {roster.length === 0 ? (
        <p className="text-sm text-slate-500">Añade viajeros en Plazas y viajeros, define el precio y genera enlaces.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {roster.map((r) => {
            const overall = r.payment?.summary.overall ?? "pending";
            return (
              <li key={r.participantId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.displayName ?? "Viajero"}</p>
                  {r.email ? <p className="text-xs text-slate-500">{r.email}</p> : null}
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${PAYMENT_OVERALL_COLORS[overall]}`}
                  >
                    {PAYMENT_OVERALL_LABELS[overall]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.payment?.depositPayUrl && overall !== "paid" && r.payment.summary.overall !== "deposit_paid" ? (
                    <button
                      type="button"
                      onClick={() => void copy(r.payment!.depositPayUrl!)}
                      className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                      Señal
                    </button>
                  ) : null}
                  {r.payment?.finalPayUrl && overall === "deposit_paid" ? (
                    <button
                      type="button"
                      onClick={() => void copy(r.payment!.finalPayUrl!)}
                      className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                      Final
                    </button>
                  ) : null}
                  {!r.payment ? (
                    <span className="text-[10px] text-amber-700">Sin enlace — genera enlaces</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] text-slate-400">
        <CreditCard className="mr-1 inline h-3 w-3" />
        Los pagos van a la cuenta Stripe de la plataforma (MVP). Webhook: evento checkout.session.completed.
      </p>
    </div>
  );
}
