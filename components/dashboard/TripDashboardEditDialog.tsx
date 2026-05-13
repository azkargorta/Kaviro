"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import TripPlacesFields from "@/components/dashboard/TripPlacesFields";
import { joinTripPlaces, splitTripPlaces } from "@/lib/trip-places";
import { buildTravelCurrencySelectOptions, coerceTravelCurrencyCode } from "@/lib/travel-currencies";

export type TripEditFields = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
};

export default function TripDashboardEditDialog({
  trip,
  open,
  onClose,
  onSaved,
}: {
  trip: TripEditFields | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [places, setPlaces] = useState<string[]>([""]);
  const destinationHint = useMemo(() => joinTripPlaces(places), [places]);
  const currencyOptions = useMemo(
    () => buildTravelCurrencySelectOptions(destinationHint),
    [destinationHint]
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("EUR");
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!trip || !open) return;
    setPlaces(splitTripPlaces(trip.destination));
    setStartDate(trip.start_date ?? "");
    setEndDate(trip.end_date ?? "");
    const cur = (trip.base_currency || "EUR").toUpperCase();
    setBaseCurrency(coerceTravelCurrencyCode(/^[A-Z]{3}$/.test(cur) ? cur : "EUR", "EUR"));
    setError(null);
  }, [trip, open]);

  useEffect(() => {
    const valid = new Set(currencyOptions.map((o) => o.code));
    if (!valid.has(baseCurrency)) {
      setBaseCurrency(currencyOptions[0]?.code ?? "EUR");
    }
  }, [currencyOptions, baseCurrency]);

  async function handleDuplicate() {
    if (!trip) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(trip.id)}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      toast.success("Viaje duplicado", "Se ha creado una copia. Ábrela para editar fechas.");
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo duplicar.";
      toast.error("Error al duplicar", msg);
    } finally {
      setDuplicating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    if (startDate && endDate && startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destination: joinTripPlaces(places) || null,
          start_date: startDate || null,
          end_date: endDate || null,
          base_currency: baseCurrency || "EUR",
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || `Error ${res.status}`);
      toast.success("Viaje actualizado", "Destino, fechas y moneda guardados.");
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar.";
      setError(msg);
      toast.error("No se pudo guardar", msg);
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || !open || !trip) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-dash-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1E293B]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Editar viaje</p>
            <h2 id="trip-dash-edit-title" className="mt-1 truncate text-lg font-bold text-slate-950">
              {trip.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Moneda, destino y fechas (requiere permiso de gestión del viaje).</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-[#334155] dark:text-slate-300 dark:hover:bg-[#1E293B]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 px-5 py-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          ) : null}

          <TripPlacesFields places={places} onChange={setPlaces} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-slate-200 focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-slate-200 focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Moneda base del viaje</label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-slate-200 focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 dark:border-[#1E293B] pt-4">
            <button
              type="button"
              onClick={() => void handleDuplicate()}
              disabled={duplicating || saving}
              className="inline-flex min-h-[44px] items-center gap-2 justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              {duplicating ? "Duplicando…" : "Duplicar viaje"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
