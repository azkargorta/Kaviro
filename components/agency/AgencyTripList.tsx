"use client";

import { useMemo, useState } from "react";
import AgencyTripCard, { type AgencyTripRow } from "@/components/agency/AgencyTripCard";
import AgencyCreateTripForm from "@/components/agency/AgencyCreateTripForm";

type Filter = "all" | "active" | "upcoming" | "past";

function categorize(trips: AgencyTripRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  const active: AgencyTripRow[] = [];
  const upcoming: AgencyTripRow[] = [];
  const past: AgencyTripRow[] = [];
  const other: AgencyTripRow[] = [];

  for (const t of trips) {
    const s = t.start_date;
    const e = t.end_date;
    if (s && e && s <= today && today <= e) active.push(t);
    else if (s && s > today) upcoming.push(t);
    else if (e && e < today) past.push(t);
    else other.push(t);
  }
  return { active, upcoming, past, other };
}

export default function AgencyTripList({
  trips,
  agencySlug,
}: {
  trips: AgencyTripRow[];
  agencySlug: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const buckets = useMemo(() => categorize(trips), [trips]);

  const filtered = useMemo(() => {
    if (filter === "active") return buckets.active;
    if (filter === "upcoming") return buckets.upcoming;
    if (filter === "past") return buckets.past;
    return trips;
  }, [filter, trips, buckets]);

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: trips.length },
    { id: "active", label: "En curso", count: buckets.active.length },
    { id: "upcoming", label: "Próximos", count: buckets.upcoming.length },
    { id: "past", label: "Pasados", count: buckets.past.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Viajes de la agencia</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Todos los grupos que gestiona tu organización en un solo panel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex min-h-10 items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
        >
          {showCreate ? "Cerrar" : "Nuevo viaje"}
        </button>
      </div>

      {showCreate ? <AgencyCreateTripForm onCreated={() => setShowCreate(false)} /> : null}

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === c.id
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-600 dark:bg-[#1E293B] dark:text-slate-300"
            }`}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-[#334155] dark:text-slate-400">
          No hay viajes en esta categoría. Crea uno o asigna <code className="text-xs">agency_id</code> en Supabase.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((trip) => (
            <AgencyTripCard key={trip.id} trip={trip} agencySlug={agencySlug} />
          ))}
        </div>
      )}
    </div>
  );
}
