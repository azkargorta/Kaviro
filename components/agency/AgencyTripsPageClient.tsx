"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgencyTripListRow } from "@/lib/agency";
import AgencyTripRowItem from "@/components/agency/AgencyTripRow";
import AgencyCreateTripForm from "@/components/agency/AgencyCreateTripForm";
import AgencyInstantiateFromTemplateModal from "@/components/agency/AgencyInstantiateFromTemplateModal";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
} from "@/lib/agency-theme";
import { Layers, Plus } from "lucide-react";

function categorize(trips: AgencyTripListRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  const active: AgencyTripListRow[] = [];
  const upcoming: AgencyTripListRow[] = [];
  const past: AgencyTripListRow[] = [];

  for (const t of trips) {
    const s = t.start_date;
    const e = t.end_date;
    if (s && e && s <= today && today <= e) active.push(t);
    else if (s && s > today) upcoming.push(t);
    else if (e && e < today) past.push(t);
    else active.push(t);
  }
  return { active, upcoming, past };
}

type Props = {
  agencySlug: string;
  trips: AgencyTripListRow[];
};

export default function AgencyTripsPageClient({ agencySlug, trips }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showFromTemplate, setShowFromTemplate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "past">("all");
  const [capacityByTrip, setCapacityByTrip] = useState<
    Record<string, { label: string }>
  >({});
  const buckets = useMemo(() => categorize(trips), [trips]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agencies/trips/capacity-summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { summaries?: Record<string, { label: string }> }) => {
        if (!cancelled && data.summaries) setCapacityByTrip(data.summaries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trips.length]);

  const filtered = useMemo(() => {
    if (filter === "active") return buckets.active;
    if (filter === "upcoming") return [...buckets.active, ...buckets.upcoming];
    if (filter === "past") return buckets.past;
    return trips;
  }, [filter, trips, buckets]);

  const tabs = [
    { key: "all" as const, label: "Todos", count: trips.length },
    { key: "active" as const, label: "En curso", count: buckets.active.length },
    { key: "upcoming" as const, label: "Preparación", count: buckets.upcoming.length },
    { key: "past" as const, label: "Finalizados", count: buckets.past.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setShowFromTemplate(true);
            setShowCreate(false);
          }}
          className={`${agencyBtnSecondaryClass} gap-1.5 text-xs`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden />
          Desde plantilla
        </button>
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setShowFromTemplate(false);
          }}
          className={showCreate ? agencyBtnSecondaryClass : `${agencyBtnPrimaryClass} gap-1.5 text-xs`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {showCreate ? "Cancelar" : "Nuevo viaje"}
        </button>
      </div>

      {showCreate ? (
        <AgencyCreateTripForm agencySlug={agencySlug} onCreated={() => setShowCreate(false)} />
      ) : null}

      <AgencyInstantiateFromTemplateModal
        open={showFromTemplate}
        onClose={() => setShowFromTemplate(false)}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filter === tab.key
                ? "bg-[#1e3a5f] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={`${agencyCardClass} px-4 py-10 text-center text-sm text-slate-600`}>
          No hay viajes en esta vista. Crea uno con «Nuevo viaje».
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => (
            <AgencyTripRowItem
              key={trip.id}
              trip={trip}
              agencySlug={agencySlug}
              capacityLabel={capacityByTrip[trip.id]?.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
