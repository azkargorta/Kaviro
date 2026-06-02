"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { joinTripPlaces } from "@/lib/trip-places";
import { buildTravelCurrencySelectOptions, coerceTravelCurrencyCode } from "@/lib/travel-currencies";
import { Plus, Trash2 } from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import {
  defaultWeatherStaysFromTrip,
  listTripDateRange,
  normalizeWeatherStays,
  type TripWeatherStay,
  validateWeatherStays,
} from "@/lib/trip-weather-stays";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { agencyCardClass } from "@/lib/agency-theme";

type TripSettingsViewProps = {
  tripId: string;
  readOnly?: boolean;
};

type SettingsTrip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  budget_target: number | null;
  weather_stays: TripWeatherStay[];
};

function newStayId() {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function TripSettingsView({ tripId, readOnly = false }: TripSettingsViewProps) {
  const router = useRouter();
  const { hideWeather, isAgencyTrip, clientPortalHref } = useTripWorkspace();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [budgetTarget, setBudgetTarget] = useState("");
  const [weatherStays, setWeatherStays] = useState<TripWeatherStay[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [dbHint, setDbHint] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/access`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudieron cargar los ajustes");

      const missing = Array.isArray(json?.missingColumns) ? (json.missingColumns as string[]) : [];
      if (missing.includes("budget_target") || missing.includes("weather_stays")) {
        const parts: string[] = [];
        if (missing.includes("budget_target")) parts.push("docs/kaviro_trips_budget_target.sql");
        if (missing.includes("weather_stays")) parts.push("docs/kaviro_trips_weather_stays.sql");
        setDbHint(`Faltan columnas en Supabase. Ejecuta: ${parts.join(" y ")}`);
      } else {
        setDbHint(null);
      }

      const trip = json?.trip as SettingsTrip | null;
      if (!trip) throw new Error("Viaje no encontrado");

      setName(typeof trip.name === "string" ? trip.name : "");
      setDestination(trip.destination ?? "");
      setStartDate(trip.start_date?.slice(0, 10) ?? "");
      setEndDate(trip.end_date?.slice(0, 10) ?? "");
      setCurrency(coerceTravelCurrencyCode(trip.base_currency, "EUR"));
      setBudgetTarget(
        typeof trip.budget_target === "number" && trip.budget_target > 0 ? String(trip.budget_target) : ""
      );

      const stays = normalizeWeatherStays(trip.weather_stays);
      if (stays.length) {
        setWeatherStays(stays);
      } else {
        setWeatherStays(
          defaultWeatherStaysFromTrip({
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
          })
        );
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const tripDays = useMemo(() => listTripDateRange(startDate, endDate), [startDate, endDate]);

  const destinationHint = useMemo(() => {
    const parts = [destination, ...weatherStays.map((s) => s.city)];
    return joinTripPlaces(parts);
  }, [destination, weatherStays]);

  const currencyOptions = useMemo(
    () => buildTravelCurrencySelectOptions(destinationHint),
    [destinationHint]
  );

  useEffect(() => {
    const valid = new Set(currencyOptions.map((o) => o.code));
    if (!valid.has(currency)) {
      setCurrency(coerceTravelCurrencyCode(currency, currencyOptions[0]?.code ?? "EUR"));
    }
  }, [currencyOptions, currency]);

  function addWeatherStay() {
    const firstDay = tripDays[0] || startDate || "";
    const lastDay = tripDays[tripDays.length - 1] || endDate || firstDay;
    setWeatherStays((prev) => [
      ...prev,
      { id: newStayId(), city: "", start_date: firstDay, end_date: lastDay },
    ]);
  }

  function updateStay(id: string, patch: Partial<TripWeatherStay>) {
    setWeatherStays((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStay(id: string) {
    setWeatherStays((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveWarning(null);
    setSaved(false);

    const stays = hideWeather ? [] : normalizeWeatherStays(weatherStays);
    if (!hideWeather) {
      const stayErr = validateWeatherStays(stays, startDate || null, endDate || null);
      if (stayErr) {
        setSaveError(stayErr);
        setSaving(false);
        return;
      }
    }

    const destFromStays = hideWeather ? "" : joinTripPlaces(stays.map((s) => s.city));
    const finalDestination = destination.trim() || destFromStays;
    if (!hideWeather && !finalDestination && stays.length === 0) {
      setSaveError("Indica al menos un destino o una ciudad de alojamiento para el clima.");
      setSaving(false);
      return;
    }

    let budgetNum: number | null = null;
    if (budgetTarget.trim()) {
      const n = parseFloat(budgetTarget.replace(",", ".").trim());
      if (!Number.isFinite(n) || n <= 0) {
        setSaveError("El presupuesto debe ser un número mayor que 0.");
        setSaving(false);
        return;
      }
      budgetNum = n;
    }

    if (startDate && endDate && startDate > endDate) {
      setSaveError("La fecha de inicio no puede ser posterior a la fecha de fin.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          destination: (hideWeather ? destination.trim() : finalDestination) || null,
          start_date: startDate || null,
          end_date: endDate || null,
          base_currency: currency,
          budget_target: budgetNum,
          ...(hideWeather ? {} : { weather_stays: stays }),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudo guardar");
      if (typeof json?.warning === "string" && json.warning.trim()) {
        setSaveWarning(json.warning);
      } else {
        setSaveWarning(null);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await loadSettings();
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] transition";
  const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] mb-1.5";

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Cargando ajustes">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
          <div className="h-4 w-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadSettings()}
          className="mt-2 text-xs font-bold underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {dbHint ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {dbHint}
        </div>
      ) : null}
      {readOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Modo lectura: no puedes cambiar los ajustes de este viaje.
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">
            Datos del viaje
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Nombre, fechas y destino general que aparecen en el encabezado del viaje.
          </p>
        </div>

        <div>
          <label className={labelClass}>Nombre del viaje</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
            placeholder="Ej: Honfleur Normandía"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Fecha de inicio</label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de fin</label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={readOnly}
              min={startDate || undefined}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Destino (texto general)</label>
          <input
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={readOnly}
            placeholder="Ciudad o región principal"
          />
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
            {hideWeather
              ? "Ciudad o región principal del programa."
              : "Opcional si configuras ciudades por fecha abajo. Sirve como referencia rápida del viaje."}
          </p>
        </div>

        {isAgencyTrip && clientPortalHref ? (
          <div className={`${agencyCardClass} p-4 text-sm`}>
            <p className="font-semibold text-slate-900 dark:text-white">Portal cliente</p>
            <p className="mt-1 font-mono text-xs text-slate-600 break-all dark:text-slate-400">{clientPortalHref}</p>
          </div>
        ) : null}

      </div>

      {!hideWeather ? (
      <div
        id="clima"
        className="rounded-2xl border border-sky-200/70 bg-gradient-to-b from-sky-50/80 to-white p-5 shadow-sm space-y-4 dark:border-sky-900/40 dark:from-[var(--surface-card)] dark:to-[var(--surface-card)] scroll-mt-24"
      >
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">
            Ciudades y días (clima)
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Indica en qué ciudad estáis cada tramo del viaje. El Resumen mostrará la previsión de la ciudad
            correspondiente a cada fecha.
          </p>
        </div>

        {!startDate || !endDate ? (
          <p className="rounded-xl border border-dashed border-sky-200 bg-white/80 px-3 py-2 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-[#080C14] dark:text-sky-200">
            Primero define las fechas de inicio y fin del viaje.
          </p>
        ) : null}

        <div className="space-y-3">
          {weatherStays.map((stay, index) => (
            <div
              key={stay.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#080C14]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Tramo {index + 1}
                </span>
                {!readOnly && weatherStays.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeStay(stay.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar tramo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Ciudad de alojamiento</label>
                  {readOnly ? (
                    <input className={inputClass} value={stay.city} disabled readOnly />
                  ) : (
                    <PlaceAutocompleteInput
                      value={stay.city}
                      onChange={(v) => updateStay(stay.id, { city: v })}
                      onPlaceSelect={(p) => updateStay(stay.id, { city: p.address })}
                      placeholder="Buscar ciudad…"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Desde (día)</label>
                    <select
                      className={inputClass}
                      value={stay.start_date}
                      disabled={readOnly || !tripDays.length}
                      onChange={(e) => updateStay(stay.id, { start_date: e.target.value })}
                    >
                      {tripDays.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Hasta (día)</label>
                    <select
                      className={inputClass}
                      value={stay.end_date}
                      disabled={readOnly || !tripDays.length}
                      onChange={(e) => updateStay(stay.id, { end_date: e.target.value })}
                    >
                      {tripDays.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!readOnly ? (
          <button
            type="button"
            onClick={addWeatherStay}
            disabled={!startDate || !endDate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Añadir otra ciudad
          </button>
        ) : null}
      </div>
      ) : null}

      <div
        id="presupuesto"
        className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-3 scroll-mt-24"
      >
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">
            Presupuesto objetivo
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Cuánto queréis gastar en total y en qué moneda. Verás la barra en Resumen y en Gastos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
          <div>
            <label className={labelClass}>Importe objetivo</label>
            <input
              type="number"
              className={inputClass}
              value={budgetTarget}
              onChange={(e) => setBudgetTarget(e.target.value)}
              disabled={readOnly}
              placeholder="Ej: 1500"
              min="0"
              step="10"
            />
          </div>
          <div>
            <label className={labelClass}>Moneda del presupuesto</label>
            <select
              className={inputClass}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={readOnly}
            >
              {currencyOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          La moneda del presupuesto es también la <span className="font-semibold">moneda base</span> del viaje
          (gastos y balances). Las opciones con ★ encajan con tu destino.
        </p>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {saved && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">✓ Guardado</span>}
          {saveError && <span className="text-sm font-semibold text-red-600 dark:text-red-400">{saveError}</span>}
        </div>
      )}

      {saveWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {saveWarning}
        </p>
      ) : null}

      {!readOnly && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">
            Exportar datos
          </h3>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Descarga los gastos del viaje en formato CSV.
          </p>
          <div className="mt-4">
            <a
              href={`/api/trip-expenses?tripId=${tripId}&format=csv`}
              download={`gastos-${tripId}.csv`}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F1623] px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-[#1E293B]"
            >
              Exportar gastos CSV
            </a>
          </div>
        </div>
      )}

      <TripAnalyticsPanel tripId={tripId} />
    </div>
  );
}

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
      .then((d: AnalyticsData & { error?: string }) => {
        if (!d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoadingA(false));
  }, [tripId]);

  if (loadingA) return null;
  if (!data || data.total === 0) return null;

  const maxViews = Math.max(...data.tabs.map((t) => t.views), 1);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.1em]">
          Actividad del viaje
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">{data.total} visitas · 30 días</span>
      </div>
      <div className="space-y-2">
        {data.tabs.slice(0, 6).map((tab) => (
          <div key={tab.name} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-[var(--text-secondary)] truncate">
              {tab.name}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--surface-page)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F87171] transition-all duration-500"
                style={{ width: `${Math.round((tab.views / maxViews) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs font-bold text-[var(--text-tertiary)] tabular-nums">
              {tab.views}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
