"use client";

import { useRouter } from "next/navigation";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import TripPlacesFields from "@/components/dashboard/TripPlacesFields";
import { joinTripPlaces } from "@/lib/trip-places";
import { buildTravelCurrencySelectOptions } from "@/lib/travel-currencies";
import {
  canShowExpensesGroupCreation,
  expensesGroupRolloutAtLeast,
  getExpensesGroupRolloutPhase,
} from "@/lib/expenses-group-rollout";

function withTimeout<T>(promiseLike: PromiseLike<T>, ms = 25000, label = "operación"): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`La operación tardó demasiado (${label})`)), ms)
    ),
  ]);
}

export default function CreateTripForm({
  isPremium = false,
  initialMode = "travel",
}: {
  isPremium?: boolean;
  initialMode?: "travel" | "expenses";
}) {
  const router = useRouter();
  const toast = useToast();

  const rolloutPhase = getExpensesGroupRolloutPhase();
  const showExpensesGroup = canShowExpensesGroupCreation(rolloutPhase);
  const showExpensesTabs = expensesGroupRolloutAtLeast(rolloutPhase, "create");

  const [creationMode, setCreationMode] = useState<"travel" | "expenses">(
    showExpensesGroup && initialMode === "expenses" ? "expenses" : "travel"
  );

  useEffect(() => {
    if (!showExpensesGroup) {
      setCreationMode("travel");
      return;
    }
    setCreationMode(initialMode === "expenses" ? "expenses" : "travel");
  }, [initialMode, showExpensesGroup]);

  const [name, setName] = useState("");
  const [places, setPlaces] = useState<string[]>([""]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "trip" | "done">("idle");

  const destinationHint = useMemo(() => joinTripPlaces(places), [places]);
  const currencyOptions = useMemo(
    () => buildTravelCurrencySelectOptions(destinationHint),
    [destinationHint]
  );

  useEffect(() => {
    const valid = new Set(currencyOptions.map((option) => option.code));
    if (!valid.has(baseCurrency)) {
      setBaseCurrency(currencyOptions[0]?.code ?? "EUR");
    }
  }, [currencyOptions, baseCurrency]);

  useEffect(() => {
    if (!startDate) return;
    if (!endDate || endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setStep("idle");

    const trimmedDestination = joinTripPlaces(places);
    const trimmedName =
      name.trim() ||
      (creationMode === "travel" && trimmedDestination ? trimmedDestination : "Grupo de gastos");

    if (creationMode === "travel" && !trimmedDestination) {
      setError("Indica al menos un destino para crear tu viaje.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    setLoading(true);

    try {
      setStep("trip");
      const createResult = await withTimeout(
        fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            trip_mode: creationMode,
            destination: creationMode === "expenses" ? null : trimmedDestination,
            start_date: creationMode === "expenses" ? null : startDate || null,
            end_date: creationMode === "expenses" ? null : endDate || null,
            base_currency: baseCurrency || "EUR",
          }),
        }),
        25000,
        "crear viaje"
      );

      const payload = await createResult.json().catch(() => null);
      if (!createResult.ok) {
        throw new Error(payload?.error || "No se pudo crear el viaje.");
      }

      const newTripId = String(payload?.tripId || "");
      if (!newTripId) throw new Error("No se pudo crear el viaje (sin id).");

      if (creationMode === "expenses") {
        trackEvent(ANALYTICS_EVENTS.EXPENSE_GROUP_CREATED, { trip_id: newTripId });
      } else {
        trackEvent(ANALYTICS_EVENTS.TRIP_CREATED, { trip_id: newTripId, source: "dashboard_form" });
      }

      setName("");
      setPlaces([""]);
      setStartDate("");
      setEndDate("");
      setBaseCurrency("EUR");

      setStep("done");
      toast.success(
        creationMode === "expenses" ? "Grupo creado" : "Viaje creado",
        creationMode === "expenses"
          ? "Empieza añadiendo el primer gasto cuando lo necesites."
          : "Ya está listo. Ahora te enseñamos solo los siguientes pasos útiles."
      );
      router.push(
        creationMode === "expenses"
          ? `/trip/${encodeURIComponent(newTripId)}/expenses?recien=1`
          : `/trip/${encodeURIComponent(newTripId)}/summary?recien=1`
      );
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el viaje.";
      setError(message);
      toast.error("No se pudo crear el viaje", message);
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  return (
    <form onSubmit={handleCreateTrip} className="card-soft p-6">
      <div className="mb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#F87171]">Tu primer paso</p>
        <h2 className="text-2xl font-bold text-slate-950">
          {creationMode === "expenses" && showExpensesGroup ? "Crea un grupo de gastos" : "¿A dónde vas?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {creationMode === "expenses" && showExpensesGroup
            ? "Ponle un nombre y empieza. Las fechas son opcionales."
            : "Con el destino ya puedes crear el viaje. Fechas, nombre y moneda se pueden ajustar después."}
        </p>
      </div>

      {showExpensesTabs ? (
        <div className="mb-5 flex flex-wrap gap-2" aria-label="Tipo de espacio">
          <button
            type="button"
            onClick={() => setCreationMode("travel")}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
              creationMode === "travel"
                ? "border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
            }`}
          >
            ✈️ Organizar un viaje
          </button>
          <button
            type="button"
            onClick={() => setCreationMode("expenses")}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
              creationMode === "expenses"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
            }`}
          >
            💸 Solo repartir gastos
          </button>
        </div>
      ) : showExpensesGroup && creationMode === "travel" ? (
        <button
          type="button"
          onClick={() => setCreationMode("expenses")}
          className="mb-5 text-xs font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          ¿Solo quieres repartir gastos? Crear grupo sin itinerario →
        </button>
      ) : showExpensesGroup && creationMode === "expenses" ? (
        <button
          type="button"
          onClick={() => setCreationMode("travel")}
          className="mb-5 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
        >
          ← Volver a crear viaje
        </button>
      ) : null}

      {!isPremium && creationMode === "travel" ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          No necesitas configurar todo ahora. Después de crear el viaje, Kaviro te indicará qué puedes hacer a continuación.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {creationMode === "travel" ? (
          <div className="md:col-span-2">
            <TripPlacesFields places={places} onChange={setPlaces} />
          </div>
        ) : null}

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-800">
            {creationMode === "expenses" ? "Nombre del grupo" : "Nombre del viaje"}
            <span className="ml-1 font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
            placeholder={
              creationMode === "expenses"
                ? "Ej. Fin de semana con amigos"
                : destinationHint
                  ? `Ej. ${destinationHint} 2027`
                  : "Ej. Japón 2027"
            }
          />
          {creationMode === "travel" ? (
            <p className="mt-1.5 text-xs text-slate-500">Si lo dejas vacío, usaremos el destino como nombre.</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            {creationMode === "expenses" ? "Desde" : "Fecha de inicio"}
            <span className="ml-1 font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            {creationMode === "expenses" ? "Hasta" : "Fecha de fin"}
            <span className="ml-1 font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
          />
        </div>

        <details className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">Opciones avanzadas</summary>
          <div className="mt-3 max-w-xl">
            <label className="mb-1 block text-sm font-medium text-slate-800">Moneda base</label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
            >
              {currencyOptions.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </details>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={loading} className="btn-press btn-primary min-h-[44px] disabled:opacity-50">
          {loading
            ? step === "trip"
              ? "Creando..."
              : "Guardando..."
            : creationMode === "expenses"
              ? "Crear grupo"
              : "Crear mi viaje →"}
        </button>
        {creationMode === "travel" ? (
          <p className="text-xs text-slate-500">Podrás cambiar estos datos en Ajustes cuando quieras.</p>
        ) : null}
      </div>
    </form>
  );
}
