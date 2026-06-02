"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { AGENCY_PARTNERSHIP_EMAIL, agencyPartnershipMailto, KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { agencyCardClass, agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";

type Member = {
  userId: string;
  role: string;
  displayName: string;
  email: string | null;
  isOwner: boolean;
};

type Props = {
  agencyName: string;
  yourRole: string;
};

export default function AgencyTeamPanel({ agencyName, yourRole }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [maxMembers, setMaxMembers] = useState(3);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agencies/team", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setMaxMembers(data.maxMembers ?? 3);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Equipo</h1>
        <p className={agencyPageSubtitleClass}>
          Personas con acceso al panel de <strong>{agencyName}</strong>. Tu rol:{" "}
          <span className="font-semibold">{yourRole}</span>.
        </p>
      </div>

      <div className={`${agencyCardClass} p-5`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4" aria-hidden />
            Miembros ({members.length}/{maxMembers})
          </h2>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Cargando…</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-[#1E293B]">
            {members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {m.displayName}
                    {m.isOwner ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">(propietario)</span>
                    ) : null}
                  </p>
                  {m.email ? <p className="text-xs text-slate-500">{m.email}</p> : null}
                </div>
                <span className="rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 text-xs font-bold uppercase text-[#1e3a5f] dark:bg-sky-900/30 dark:text-sky-200">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600 dark:border-[#334155] dark:text-slate-400">
        <p className="font-semibold text-slate-800 dark:text-slate-200">¿Añadir a alguien?</p>
        <p className="mt-1">
          Escríbenos a{" "}
          <a href={agencyPartnershipMailto(`Nuevo miembro en ${KAVIRO_TRIPS_PRODUCT_NAME}`)} className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            {AGENCY_PARTNERSHIP_EMAIL}
          </a>{" "}
          con el email de la persona y el rol (admin o editor). Las invitaciones automáticas llegarán en una
          actualización.
        </p>
      </div>
    </div>
  );
}
