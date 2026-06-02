"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { agencyCardClass } from "@/lib/agency-theme";
import { AGENCY_PARTNERSHIP_EMAIL } from "@/lib/brand";

type Overview = {
  trips: number;
  publishedPortals: number;
  portalViews30d: number;
  members: number;
  maxMembers: number;
  pendingInvites: number;
  templates: number;
};

const CHECKLIST = [
  { href: "/agency/branding", label: "Configura logo y color de marca" },
  { href: "/agency/clients", label: "Registra tus clientes" },
  { href: "/agency/team", label: "Invita a tu equipo por email" },
  { href: "/agency/templates", label: "Guarda una plantilla de viaje" },
  { href: "/agency", label: "Publica el portal de un programa" },
] as const;

export default function AgencyOverviewPanel() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/agencies/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.trips != null) setData(json as Overview);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Programas", value: data.trips },
          { label: "Portales publicados", value: data.publishedPortals },
          { label: "Vistas portal (30 d)", value: data.portalViews30d },
          { label: "Equipo", value: `${data.members}/${data.maxMembers}` },
        ].map((s) => (
          <div key={s.label} className={`${agencyCardClass} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`${agencyCardClass} p-4`}>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Primeros pasos</p>
        <ul className="mt-3 space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-[#1e3a5f] underline hover:no-underline dark:text-sky-300"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Plan y número de perfiles acordados con Kaviro. Para ampliar equipo o funciones:{" "}
        <a href={`mailto:${AGENCY_PARTNERSHIP_EMAIL}`} className="font-semibold text-[#1e3a5f] dark:text-sky-300">
          {AGENCY_PARTNERSHIP_EMAIL}
        </a>
      </p>
    </div>
  );
}
