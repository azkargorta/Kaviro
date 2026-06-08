"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plane, X } from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import { useToast } from "@/components/ui/toast";

type Props = {
  tripId: string;
  groupName: string;
  initialDestination?: string | null;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  canManage?: boolean;
};

export default function ConvertExpenseGroupToTripPanel({
  tripId,
  groupName,
  initialDestination = "",
  initialStartDate = "",
  initialEndDate = "",
  canManage = true,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(initialDestination ?? "");
  const [startDate, setStartDate] = useState(initialStartDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(initialEndDate?.slice(0, 10) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDestination(initialDestination ?? "");
    setStartDate(initialStartDate?.slice(0, 10) ?? "");
    setEndDate(initialEndDate?.slice(0, 10) ?? "");
  }, [initialDestination, initialStartDate, initialEndDate]);

  useEffect(() => {
    if (!startDate) return;
    if (!endDate || endDate < startDate) setEndDate(startDate);
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canManage) return null;

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setError("El destino es obligatorio.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la de fin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/convert-to-travel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destination: trimmedDestination,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudo convertir el grupo.");

      toast.success("Ahora es un viaje", "Se han activado plan, mapa y el resto de secciones.");
      setOpen(false);
      router.push(`/trip/${encodeURIComponent(tripId)}/summary?recien=1`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo convertir el grupo.";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm dark:border-sky-900/40 dark:from-sky-950/30 dark:to-[#0F1623]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-extrabold text-sky-900 dark:text-sky-200">
              <Plane className="h-4 w-4" aria-hidden />
              Convertir en viaje
            </p>
            <p className="mt-1 text-sm text-sky-900/80 dark:text-sky-200/80">
              Añade destino y activa plan, mapa, documentos e IA. Los gastos y participantes de «{groupName}» se
              mantienen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700"
          >
            Pasar a viaje
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="convert-group-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-[#334155] dark:bg-[#0F1623]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="convert-group-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Convertir «{groupName}» en viaje
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Indica el destino. Las fechas son opcionales si ya las tenías en el grupo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleConvert(e)} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Destino
                <div className="mt-1.5">
                  <PlaceAutocompleteInput
                    value={destination}
                    onChange={setDestination}
                    onPlaceSelect={(p) => setDestination(p.address)}
                    placeholder="Ej. Roma, Italia"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Desde
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-[#334155] dark:bg-[#080C14]"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Hasta
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    disabled={loading}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-[#334155] dark:bg-[#080C14]"
                  />
                </label>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? "Convirtiendo…" : "Confirmar y activar viaje"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 dark:border-[#334155] dark:text-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
