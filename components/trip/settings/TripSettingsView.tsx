"use client";

import { useEffect, useState } from "react";
import { useTripData } from "@/hooks/useTripData";

type TripSettingsViewProps = {
  tripId: string;
  readOnly?: boolean;
};

export default function TripSettingsView({ tripId, readOnly = false }: TripSettingsViewProps) {
  const { trip, loading } = useTripData(tripId);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [budgetTarget, setBudgetTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trip) return;
    setName(trip.name ?? "");
    setDestination(trip.destination ?? "");
    setStartDate(trip.start_date ?? "");
    setEndDate(trip.end_date ?? "");
    setCurrency(trip.base_currency ?? "EUR");
    setBudgetTarget((trip as any).budget_target ? String((trip as any).budget_target) : "");
  }, [trip]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          base_currency: currency,
          budget_target: budgetTarget ? parseFloat(budgetTarget) : null,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Cargando ajustes">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
          <div className="h-4 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
          <div className="h-4 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] transition";
  const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] mb-1.5";

  return (
    <div className="space-y-5">
      {readOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Modo lectura: no puedes cambiar los ajustes de este viaje.
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">Información del viaje</h3>

        <div>
          <label className={labelClass}>Nombre</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} placeholder="Nombre del viaje" />
        </div>
        <div>
          <label className={labelClass}>Destino</label>
          <input className={inputClass} value={destination} onChange={(e) => setDestination(e.target.value)} disabled={readOnly} placeholder="Ciudad, país…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha inicio</label>
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={readOnly} />
          </div>
          <div>
            <label className={labelClass}>Fecha fin</label>
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={readOnly} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Moneda base</label>
          <input className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} disabled={readOnly} placeholder="EUR" maxLength={3} />
        </div>
      </div>

      {/* Budget target */}
      <div
        id="presupuesto"
        className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-3 scroll-mt-24"
      >
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">Presupuesto objetivo</h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Define cuánto quieres gastar en total. Verás la barra en el Resumen del viaje y en Gastos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            className={inputClass}
            value={budgetTarget}
            onChange={(e) => setBudgetTarget(e.target.value)}
            disabled={readOnly}
            placeholder={`Ej: 1500 ${currency}`}
            min="0"
            step="10"
          />
          <span className="shrink-0 text-sm font-semibold text-[var(--text-secondary)]">{currency}</span>
        </div>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {saved && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">✓ Guardado</span>}
          {error && <span className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</span>}
        </div>
      )}

      {/* Export section */}
      {!readOnly && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">Exportar datos</h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Descarga los gastos del viaje en formato CSV para usar en Excel u otras apps.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/trip-expenses?tripId=${tripId}&format=csv`}
              download={`gastos-${tripId}.csv`}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F1623] px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-[#1E293B]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar gastos CSV
            </a>
          </div>
        </div>
      )}
      {/* Analytics */}
      <TripAnalyticsPanel tripId={tripId} />
    </div>
  );
}

// ── Analytics mini-panel ──────────────────────────────────────────────────────
type AnalyticsData = {
  total: number;
  tabs: { name: string; views: number }[];
  daily: { date: string; views: number }[];
};

function TripAnalyticsPanel({ tripId }: { tripId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingA, setLoadingA] = useState(true);

  useEffect(() => {
    void fetch(`/api/trips/${tripId}/analytics`)
      .then((r) => r.json())
      .then((d: AnalyticsData & { error?: string }) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoadingA(false));
  }, [tripId]);

  if (loadingA) return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-page)]" />
      <div className="mt-3 h-24 animate-pulse rounded-xl bg-[var(--surface-page)]" />
    </div>
  );

  if (!data || data.total === 0) return null;

  const maxViews = Math.max(...data.tabs.map((t) => t.views), 1);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">Actividad del viaje</h3>
        <span className="text-xs text-[var(--text-tertiary)]">{data.total} visitas · 30 días</span>
      </div>
      <div className="space-y-2">
        {data.tabs.slice(0, 6).map((tab) => (
          <div key={tab.name} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-[var(--text-secondary)] truncate">{tab.name}</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface-page)] overflow-hidden">
              <div className="h-full rounded-full bg-[#F87171] transition-all duration-500"
                style={{ width: `${Math.round((tab.views / maxViews) * 100)}%` }} />
            </div>
            <span className="w-8 text-right text-xs font-bold text-[var(--text-tertiary)] tabular-nums">{tab.views}</span>
          </div>
        ))}
      </div>
      {data.daily.length > 1 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-2">Últimas 2 semanas</p>
          <div className="flex items-end gap-0.5 h-10">
            {data.daily.map((d) => {
              const mx = Math.max(...data.daily.map((x) => x.views), 1);
              const h = Math.max(4, Math.round((d.views / mx) * 40));
              return <div key={d.date} title={`${d.date}: ${d.views}`}
                className="flex-1 rounded-sm bg-[#F87171]/40 hover:bg-[#F87171] transition-colors"
                style={{ height: `${h}px` }} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
