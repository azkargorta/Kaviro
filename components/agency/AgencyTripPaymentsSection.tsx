"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCopy, CreditCard, Download, FileText, Loader2 } from "lucide-react";
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
  type PaymentPhase,
} from "@/lib/agency/payments";
import type { AgencyPaymentReceiptInfo } from "@/lib/agency/payment-record";
import { AGENCY_PAYMENT_METHOD_LABELS } from "@/lib/agency/payment-record";
import AgencyPaymentCharts from "@/components/agency/AgencyPaymentCharts";
import AgencyPaymentRecordDialog from "@/components/agency/AgencyPaymentRecordDialog";
import { useToast } from "@/components/ui/toast";

type PaymentPhaseInfo = {
  id?: string;
  pricePerPerson: number | null;
  depositAmount?: number;
  finalAmount?: number;
  depositStatus?: string;
  finalStatus?: string;
  depositPayUrl: string | null;
  finalPayUrl: string | null;
  deposit?: AgencyPaymentReceiptInfo;
  final?: AgencyPaymentReceiptInfo;
  summary: { overall: keyof typeof PAYMENT_OVERALL_LABELS };
};

type RosterRow = {
  participantId: string;
  displayName: string | null;
  email: string | null;
  payment: PaymentPhaseInfo | null;
};

type ChartsData = {
  statusCounts: { pending: number; deposit_paid: number; paid: number; cancelled: number };
  travelers: Array<{ name: string; collected: number; pending: number; overall: string }>;
  currency: string;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [recordDialog, setRecordDialog] = useState<{
    participantId: string;
    displayName: string;
    phase: PaymentPhase;
    amount: number;
    currentStatus: string;
    receipt: AgencyPaymentReceiptInfo;
  } | null>(null);

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
      setCharts(data.charts ?? null);
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
    const price = priceInput === "" ? null : Number(priceInput);
    const assigningPrice = price != null && price > 0 && selectedIds.size > 0;
    if (price != null && price > 0 && selectedIds.size === 0) {
      toast.push({
        kind: "error",
        title: "Selecciona al menos un viajero",
        description: "Marca quién debe recibir este precio.",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(assigningPrice ? { pricePerPerson: price, participantIds: [...selectedIds] } : {}),
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
      const skipped = data.applyResult?.skipped?.length ?? 0;
      const applied = data.applyResult?.applied ?? 0;
      if (applied > 0) {
        toast.push({
          kind: "success",
          title: "Tarifas guardadas",
          description:
            skipped > 0
              ? `${applied} viajero(s) actualizado(s) · ${skipped} omitido(s)`
              : `${applied} viajero(s) con este precio`,
        });
      } else {
        toast.push({ kind: "success", title: "Plazos y señal guardados" });
      }
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  function toggleParticipant(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllParticipants() {
    setSelectedIds(new Set(roster.map((r) => r.participantId)));
  }

  function clearParticipantSelection() {
    setSelectedIds(new Set());
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
  const hasAssignedPayments = roster.some(
    (r) => r.payment?.pricePerPerson != null && Number(r.payment.pricePerPerson) > 0
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Cobro en dos fases (señal + pago final): enlaces Stripe o registro manual con justificante (transferencia,
        Bizum, efectivo). Indica el precio, marca los viajeros y guarda.
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
        {hasAssignedPayments ? (
          <button type="button" disabled={busy} onClick={() => void syncPayments()} className={agencyBtnSecondaryClass}>
            Generar enlaces de pago
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || !hasAssignedPayments}
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

      {hasAssignedPayments ? (
        <>
          <p className="text-xs text-slate-500">
            Cobrado: <strong>{formatMoney(totals.collected, currency)}</strong> · Pendiente:{" "}
            <strong>{formatMoney(totals.pending, currency)}</strong> · Pagados: {totals.counts.paid} /{" "}
            {roster.length}
          </p>
          {charts ? (
            <AgencyPaymentCharts
              statusCounts={charts.statusCounts}
              travelers={charts.travelers}
              currency={charts.currency || currency}
            />
          ) : null}
        </>
      ) : null}

      {roster.length === 0 ? (
        <p className="text-sm text-slate-500">Añade viajeros en Plazas y viajeros, define el precio y genera enlaces.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Viajeros</p>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-[#0B5CFF] hover:underline" onClick={selectAllParticipants}>
                Seleccionar todos
              </button>
              <button type="button" className="text-slate-500 hover:underline" onClick={clearParticipantSelection}>
                Ninguno
              </button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {roster.map((r) => {
            const overall = r.payment?.summary.overall ?? "pending";
            const assignedPrice = r.payment?.pricePerPerson;
            const checked = selectedIds.has(r.participantId);
            return (
              <li key={r.participantId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipant(r.participantId)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.displayName ?? "Viajero"}</p>
                  {r.email ? <p className="text-xs text-slate-500">{r.email}</p> : null}
                  {assignedPrice != null && Number(assignedPrice) > 0 ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Precio asignado: {formatMoney(Number(assignedPrice), currency)}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300">Sin precio asignado</p>
                  )}
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${PAYMENT_OVERALL_COLORS[overall]}`}
                  >
                    {PAYMENT_OVERALL_LABELS[overall]}
                  </span>
                </div>
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  {r.payment && Number(r.payment.pricePerPerson) > 0 ? (
                    <>
                      {r.payment.depositStatus !== "paid" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRecordDialog({
                              participantId: r.participantId,
                              displayName: r.displayName ?? "Viajero",
                              phase: "deposit",
                              amount: Number(r.payment!.depositAmount ?? 0),
                              currentStatus: r.payment!.depositStatus ?? "pending",
                              receipt: r.payment!.deposit ?? {
                                paymentMethod: null,
                                receiptPath: null,
                                receiptName: null,
                                receiptMime: null,
                                receiptUrl: null,
                                manualNotes: null,
                                paidAt: null,
                                recordedBy: null,
                              },
                            })
                          }
                          className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                        >
                          Registrar señal
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRecordDialog({
                              participantId: r.participantId,
                              displayName: r.displayName ?? "Viajero",
                              phase: "deposit",
                              amount: Number(r.payment!.depositAmount ?? 0),
                              currentStatus: "paid",
                              receipt: r.payment!.deposit ?? {
                                paymentMethod: null,
                                receiptPath: null,
                                receiptName: null,
                                receiptMime: null,
                                receiptUrl: null,
                                manualNotes: null,
                                paidAt: null,
                                recordedBy: null,
                              },
                            })
                          }
                          className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                          title="Ver o editar justificante de señal"
                        >
                          <FileText className="h-3 w-3" />
                          Señal ✓
                        </button>
                      )}
                      {r.payment.depositStatus === "paid" && r.payment.finalStatus !== "paid" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRecordDialog({
                              participantId: r.participantId,
                              displayName: r.displayName ?? "Viajero",
                              phase: "final",
                              amount: Number(r.payment!.finalAmount ?? 0),
                              currentStatus: r.payment!.finalStatus ?? "pending",
                              receipt: r.payment!.final ?? {
                                paymentMethod: null,
                                receiptPath: null,
                                receiptName: null,
                                receiptMime: null,
                                receiptUrl: null,
                                manualNotes: null,
                                paidAt: null,
                                recordedBy: null,
                              },
                            })
                          }
                          className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                        >
                          Registrar final
                        </button>
                      ) : null}
                      {r.payment.finalStatus === "paid" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRecordDialog({
                              participantId: r.participantId,
                              displayName: r.displayName ?? "Viajero",
                              phase: "final",
                              amount: Number(r.payment!.finalAmount ?? 0),
                              currentStatus: "paid",
                              receipt: r.payment!.final ?? {
                                paymentMethod: null,
                                receiptPath: null,
                                receiptName: null,
                                receiptMime: null,
                                receiptUrl: null,
                                manualNotes: null,
                                paidAt: null,
                                recordedBy: null,
                              },
                            })
                          }
                          className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                        >
                          <FileText className="h-3 w-3" />
                          Final ✓
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  {r.payment?.depositPayUrl && overall !== "paid" && r.payment.summary.overall !== "deposit_paid" ? (
                    <button
                      type="button"
                      onClick={() => void copy(r.payment!.depositPayUrl!)}
                      className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                      Link señal
                    </button>
                  ) : null}
                  {r.payment?.finalPayUrl && overall === "deposit_paid" ? (
                    <button
                      type="button"
                      onClick={() => void copy(r.payment!.finalPayUrl!)}
                      className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                      Link final
                    </button>
                  ) : null}
                  {!r.payment ? (
                    <span className="text-[10px] text-amber-700">Sin cobro — asigna precio</span>
                  ) : null}
                </div>
                {r.payment?.deposit?.paymentMethod && r.payment.depositStatus === "paid" ? (
                  <p className="w-full text-[10px] text-slate-500">
                    Señal: {AGENCY_PAYMENT_METHOD_LABELS[r.payment.deposit.paymentMethod] ?? r.payment.deposit.paymentMethod}
                    {r.payment.deposit.paidAt ? ` · ${r.payment.deposit.paidAt.slice(0, 10)}` : ""}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        </>
      )}

      <p className="text-[10px] text-slate-400">
        <CreditCard className="mr-1 inline h-3 w-3" />
        Stripe Checkout para tarjeta; transferencias y otros métodos se registran manualmente con justificante.
      </p>

      {recordDialog ? (
        <AgencyPaymentRecordDialog
          open
          onClose={() => setRecordDialog(null)}
          tripId={tripId}
          participantId={recordDialog.participantId}
          displayName={recordDialog.displayName}
          phase={recordDialog.phase}
          amount={recordDialog.amount}
          currency={currency}
          currentStatus={recordDialog.currentStatus}
          receipt={recordDialog.receipt}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}
