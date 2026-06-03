"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AgencyTripListRow } from "@/lib/agency";
import AgencyTripRowItem from "@/components/agency/AgencyTripRow";
import AgencyCreateTripForm from "@/components/agency/AgencyCreateTripForm";
import AgencyInstantiateFromTemplateModal from "@/components/agency/AgencyInstantiateFromTemplateModal";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
} from "@/lib/agency-theme";
import { ArrowRight, Layers } from "lucide-react";

type Props = {
  agencyName: string;
  agencySlug: string;
  userDisplayName: string;
  trips: AgencyTripListRow[];
  clientCount: number;
  templateCount: number;
  portalViews30d: number;
};

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

export default function AgencyDashboardHome({
  agencyName,
  agencySlug,
  userDisplayName,
  trips,
  clientCount,
  templateCount,
  portalViews30d,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showFromTemplate, setShowFromTemplate] = useState(false);
  const buckets = useMemo(() => categorize(trips), [trips]);
  const recent = useMemo(
    () => [...buckets.active, ...buckets.upcoming].slice(0, 4),
    [buckets.active, buckets.upcoming]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Bienvenido, {userDisplayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {agencyName} · {buckets.active.length} en curso · {trips.length} programas en total
          </p>
        </div>
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
            className={showCreate ? agencyBtnSecondaryClass : agencyBtnPrimaryClass}
          >
            {showCreate ? "Cancelar" : "+ Nuevo viaje"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Viajes activos", value: buckets.active.length, accent: "text-[#1e3a5f] dark:text-sky-300" },
          { label: "Clientes", value: clientCount, accent: "" },
          { label: "Vistas portal (30 d)", value: portalViews30d, accent: "text-emerald-600 dark:text-emerald-400" },
          { label: "Plantillas", value: templateCount, accent: "" },
        ].map((m) => (
          <div key={m.label} className={`${agencyCardClass} p-4 text-center`}>
            <p className={`text-2xl font-semibold tabular-nums text-slate-900 dark:text-white ${m.accent}`}>
              {m.value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
          </div>
        ))}
      </div>

      {showCreate ? (
        <AgencyCreateTripForm agencySlug={agencySlug} onCreated={() => setShowCreate(false)} />
      ) : null}

      <AgencyInstantiateFromTemplateModal
        open={showFromTemplate}
        onClose={() => setShowFromTemplate(false)}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/agency/trips", title: "Mis viajes", desc: "Listado completo y filtros" },
          { href: "/agency/clients", title: "Clientes", desc: "CRM y grupos" },
          { href: "/agency/portals", title: "Portales", desc: "Publicar programa" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${agencyCardClass} block p-4 transition hover:border-[#1e3a5f]/40 dark:hover:border-sky-700/50`}
          >
            <p className="font-semibold text-slate-900 dark:text-white">{card.title}</p>
            <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Próximos programas
          </h2>
          <Link
            href="/agency/trips"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className={`${agencyCardClass} px-4 py-10 text-center text-sm text-slate-600`}>
            Crea tu primer programa con «Nuevo viaje» o duplica una plantilla.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((trip) => (
              <AgencyTripRowItem key={trip.id} trip={trip} agencySlug={agencySlug} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
