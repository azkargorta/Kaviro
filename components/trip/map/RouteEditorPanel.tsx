"use client";

import { forwardRef, useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Info,
  MapPin,
  RefreshCw,
  Save,
} from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import RouteTravelModePicker from "@/components/trip/map/RouteTravelModePicker";
import { travelModeLabel, type TripRouteTravelMode } from "@/lib/route-travel-mode";
import type {
  RouteEditorFormState,
  RouteEditorPlace,
  RouteEditorPlacePayload,
  RouteEditorPlanOption,
  RouteEditorPreview,
} from "@/components/trip/map/route-editor-types";

function randomId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatPlanDayBadge(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const inputClass =
  "mt-1.5 min-h-[40px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15 dark:border-[#334155] dark:bg-[#0F1623] dark:text-white";
const labelClass = "text-xs font-semibold text-slate-700 dark:text-slate-300";

function SectionShell({
  num,
  title,
  subtitle,
  badge,
  children,
}: {
  num: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-[#334155] dark:bg-[#0F1623]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-[#1E293B]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white dark:bg-sky-700">
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1e3a5f] dark:text-sky-200">
            {title}
          </h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ItineraryStop({
  label,
  icon,
  planId,
  onPlanIdChange,
  planOptions,
  routeDayForPlans,
  place,
  onPlaceChange,
  onPlaceSelect,
  disabled,
}: {
  label: string;
  icon?: ReactNode;
  planId: string;
  onPlanIdChange: (id: string) => void;
  planOptions: RouteEditorPlanOption[];
  routeDayForPlans: string | null;
  place: RouteEditorPlace;
  onPlaceChange: (address: string) => void;
  onPlaceSelect: (payload: RouteEditorPlacePayload) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
        {icon}
        {label}
      </div>
      <select
        value={planId}
        onChange={(e) => onPlanIdChange(e.target.value)}
        disabled={disabled}
        className={`${inputClass} mt-0`}
      >
        <option value="">
          {routeDayForPlans && !planOptions.length ? "Sin planes este día" : "Elegir plan…"}
        </option>
        {planOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title + (p.hasCoords ? "" : " (sin ubicación)")}
          </option>
        ))}
      </select>
      <div className="mt-2">
        <PlaceAutocompleteInput
          value={place.address}
          onChange={onPlaceChange}
          onPlaceSelect={onPlaceSelect}
          placeholder="O busca un lugar…"
        />
      </div>
    </div>
  );
}

export type RouteEditorPanelProps = {
  editing: boolean;
  form: RouteEditorFormState;
  setForm: React.Dispatch<React.SetStateAction<RouteEditorFormState>>;
  travelMode: TripRouteTravelMode;
  onTravelModeChange: (mode: TripRouteTravelMode) => void;
  effectiveRouteColor: string;
  routeDayForPlans: string | null;
  planSelectOptions: RouteEditorPlanOption[];
  origin: RouteEditorPlace;
  setOrigin: React.Dispatch<React.SetStateAction<RouteEditorPlace>>;
  stop: RouteEditorPlace;
  setStop: React.Dispatch<React.SetStateAction<RouteEditorPlace>>;
  destination: RouteEditorPlace;
  setDestination: React.Dispatch<React.SetStateAction<RouteEditorPlace>>;
  originPlanId: string;
  setOriginPlanId: (id: string) => void;
  stopPlanId: string;
  setStopPlanId: (id: string) => void;
  destinationPlanId: string;
  setDestinationPlanId: (id: string) => void;
  onSelectPlace: (setter: (place: RouteEditorPlace) => void, payload: RouteEditorPlacePayload) => void;
  routePreview: RouteEditorPreview | null;
  calculatingRoute: boolean;
  saving: boolean;
  savingRoute: boolean;
  onCalculate: () => void;
  onSave: () => void;
  saveButtonClass: string;
};

const RouteEditorPanel = forwardRef<HTMLElement, RouteEditorPanelProps>(function RouteEditorPanel(
  {
    editing,
    form,
    setForm,
    travelMode,
    onTravelModeChange,
    effectiveRouteColor,
    routeDayForPlans,
    planSelectOptions,
    origin,
    setOrigin,
    stop,
    setStop,
    destination,
    setDestination,
    originPlanId,
    setOriginPlanId,
    stopPlanId,
    setStopPlanId,
    destinationPlanId,
    setDestinationPlanId,
    onSelectPlace,
    routePreview,
    calculatingRoute,
    saving,
    savingRoute,
    onCalculate,
    onSave,
    saveButtonClass,
  },
  ref
) {
  const [restNotesOpen, setRestNotesOpen] = useState(false);
  const busy = calculatingRoute || saving || savingRoute;

  useEffect(() => {
    setRestNotesOpen(false);
  }, [form.editingRouteId]);

  const planBadge =
    routeDayForPlans && planSelectOptions.length > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Solo planes del {formatPlanDayBadge(routeDayForPlans)} · {planSelectOptions.length} planes
      </span>
    ) : routeDayForPlans ? (
      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
        Sin planes con fecha ese día
      </span>
    ) : null;

  return (
    <section
      ref={ref}
      data-route-form-panel
      className="scroll-mt-4 w-full rounded-[20px] border border-slate-200/90 bg-[#f8f6f3] p-4 shadow-sm dark:border-[#334155] dark:bg-[#080C14] md:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          {editing ? "Editor de ruta" : "Nueva ruta"}
        </h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionShell num="1" title="Datos básicos" subtitle="Nombre, fecha, hora y transporte">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>
                Nombre de la ruta
                <input
                  value={form.routeName}
                  onChange={(e) => setForm((prev) => ({ ...prev, routeName: e.target.value }))}
                  className={inputClass}
                  placeholder="Ruta día 1"
                />
              </label>
              <label className={labelClass}>
                Fecha
                <input
                  type="date"
                  value={form.routeDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, routeDate: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Hora de salida
                <div className="relative">
                  <Clock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="time"
                    value={form.departureTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, departureTime: e.target.value }))}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Modo de transporte</p>
              <div className="mt-2">
                <RouteTravelModePicker
                  value={travelMode}
                  onChange={onTravelModeChange}
                  disabled={busy}
                  compact
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-[#1E293B] dark:bg-[#080C14]">
              <input
                type="color"
                value={form.autoColor ? effectiveRouteColor : form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value, autoColor: false }))}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                disabled={form.autoColor}
                aria-label="Color de la ruta"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.autoColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, autoColor: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Color auto
              </label>
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <span
                  className="inline-block h-4 w-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: effectiveRouteColor }}
                />
                {form.autoColor ? "Se asignará un color libre automáticamente" : "Color manual"}
              </span>
            </div>
          </SectionShell>

          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-[#334155] dark:bg-[#0F1623]">
            <button
              type="button"
              onClick={() => setRestNotesOpen((v) => !v)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
              aria-expanded={restNotesOpen}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white dark:bg-sky-700">
                3
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1e3a5f] dark:text-sky-200">
                  Descansos y notas
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Checklist, comentarios y paradas informativas
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-500 transition ${restNotesOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {restNotesOpen ? (
              <div className="space-y-4 border-t border-slate-100 p-4 dark:border-[#1E293B]">
                <div>
                  <label className={labelClass}>Notas</label>
                  <textarea
                    value={form.noteText}
                    onChange={(e) => setForm((prev) => ({ ...prev, noteText: e.target.value }))}
                    rows={2}
                    placeholder="Comentarios para esta ruta…"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <p className={labelClass}>Checklist</p>
                  {form.checklist.length ? (
                    <div className="mt-2 space-y-2">
                      {form.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                checklist: prev.checklist.map((x) =>
                                  x.id === item.id ? { ...x, done: e.target.checked } : x
                                ),
                              }))
                            }
                          />
                          <input
                            value={item.text}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                checklist: prev.checklist.map((x) =>
                                  x.id === item.id ? { ...x, text: e.target.value } : x
                                ),
                              }))
                            }
                            className={`${inputClass} mt-0 flex-1`}
                            placeholder="Elemento…"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                checklist: prev.checklist.filter((x) => x.id !== item.id),
                              }))
                            }
                            className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Sin elementos todavía.</p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        checklist: [...prev.checklist, { id: randomId(), text: "", done: false }],
                      }))
                    }
                    className="mt-2 text-xs font-bold text-[#1e3a5f] hover:underline dark:text-sky-300"
                  >
                    + Añadir item
                  </button>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-[#1E293B] dark:bg-[#080C14]">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.restStopsEnabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, restStopsEnabled: e.target.checked }))}
                    />
                    Paradas de descanso (informativo)
                  </label>
                  {form.restStopsEnabled ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className={labelClass}>
                        Nº paradas
                        <input
                          type="number"
                          min={0}
                          value={form.restStopsCount}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, restStopsCount: Number(e.target.value || 0) }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className={labelClass}>
                        Minutos cada una
                        <input
                          type="number"
                          min={0}
                          value={form.restStopMinutes}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, restStopMinutes: Number(e.target.value || 0) }))
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-4">
          <SectionShell num="2" title="Itinerario" subtitle="Origen, parada y destino" badge={planBadge}>
            <div className="space-y-4">
              <ItineraryStop
                label="Origen"
                icon={<MapPin className="h-3.5 w-3.5 text-emerald-600" aria-hidden />}
                planId={originPlanId}
                onPlanIdChange={setOriginPlanId}
                planOptions={planSelectOptions}
                routeDayForPlans={routeDayForPlans}
                place={origin}
                onPlaceChange={(v) => setOrigin((s) => ({ ...s, address: v }))}
                onPlaceSelect={(payload) => onSelectPlace(setOrigin, payload)}
              />

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.stopEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, stopEnabled: e.target.checked }))}
                />
                Activar parada intermedia
              </label>

              {form.stopEnabled ? (
                <ItineraryStop
                  label="Parada intermedia"
                  planId={stopPlanId}
                  onPlanIdChange={setStopPlanId}
                  planOptions={planSelectOptions}
                  routeDayForPlans={routeDayForPlans}
                  place={stop}
                  onPlaceChange={(v) => setStop((s) => ({ ...s, address: v }))}
                  onPlaceSelect={(payload) => onSelectPlace(setStop, payload)}
                />
              ) : null}

              <ItineraryStop
                label="Destino"
                icon={<MapPin className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-sky-400" aria-hidden />}
                planId={destinationPlanId}
                onPlanIdChange={setDestinationPlanId}
                planOptions={planSelectOptions}
                routeDayForPlans={routeDayForPlans}
                place={destination}
                onPlaceChange={(v) => setDestination((s) => ({ ...s, address: v }))}
                onPlaceSelect={(payload) => onSelectPlace(setDestination, payload)}
              />
            </div>
          </SectionShell>

          <SectionShell num="4" title="Previsualización y guardado" subtitle="Calcula antes de guardar">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>Calcula la ruta para ver el trazado en el mapa antes de guardar.</span>
                </div>

                {!routePreview ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    Ruta no calculada aún
                  </span>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                      Ruta calculada · {travelModeLabel(routePreview.calculatedTravelMode)}
                    </p>
                    {routePreview.calculatedTravelMode !== travelMode ? (
                      <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                        Has cambiado el modo. Vuelve a calcular.
                      </p>
                    ) : null}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white px-2 py-1.5 dark:bg-[#0F1623]">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Distancia</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {routePreview.distanceText || "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-1.5 dark:bg-[#0F1623]">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Duración</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {routePreview.durationText || "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-1.5 dark:bg-[#0F1623]">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Llegada</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {routePreview.arrivalTime || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:w-52 lg:flex-col">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCalculate}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${calculatingRoute ? "animate-spin" : ""}`} aria-hidden />
                  {calculatingRoute ? "Calculando…" : "Calcular ruta"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSave}
                  className={`${saveButtonClass} inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-60`}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {saving || savingRoute ? "Guardando…" : editing ? "Guardar cambios" : "Guardar ruta"}
                </button>
              </div>
            </div>
          </SectionShell>
        </div>
      </div>
    </section>
  );
});

export default RouteEditorPanel;
