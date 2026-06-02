"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export default function AgencyCreateTripForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [portalSlug, setPortalSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre del viaje es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agencies/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          destination: destination.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          client_portal_slug: portalSlug.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el viaje.");
      toast.push({ title: "Viaje creado", description: trimmed });
      onCreated?.();
      router.push(`/trip/${data.tripId}/summary`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1E293B] dark:bg-[#0B1220]">
      <p className="text-sm font-bold text-slate-900 dark:text-white">Nuevo viaje de cliente</p>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Nombre del viaje
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
          placeholder="Chicago NFL 2026"
        />
      </label>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Destino
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
          placeholder="Chicago, EE. UU."
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Inicio
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Fin
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Slug del portal (opcional)
        <input
          value={portalSlug}
          onChange={(e) => setPortalSlug(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
          placeholder="chicago-2026"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Creando…" : "Crear viaje"}
      </button>
    </form>
  );
}
