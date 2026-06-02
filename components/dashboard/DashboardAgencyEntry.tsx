"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Mail } from "lucide-react";

export default function DashboardAgencyEntry() {
  const [hasAgency, setHasAgency] = useState<boolean | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agencies/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { agency?: { name?: string } | null }) => {
        if (cancelled) return;
        if (data.agency?.name) {
          setHasAgency(true);
          setAgencyName(data.agency.name);
        } else {
          setHasAgency(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHasAgency(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasAgency === null) return null;

  const href = hasAgency ? "/agency" : "/empresa";

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1e3a5f]/20 bg-gradient-to-r from-[#1e3a5f]/8 to-slate-50/80 px-4 py-3 dark:border-sky-900/40 dark:from-[#1e3a5f]/15 dark:to-[#0F1623]">
      <div className="flex min-w-0 items-start gap-2.5 text-sm text-slate-800 dark:text-slate-100">
        <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
        <span>
          {hasAgency ? (
            <>
              Modo empresa — <strong>{agencyName}</strong>
            </>
          ) : (
            <>
              ¿Organizas viajes para clientes?{" "}
              <span className="text-slate-600 dark:text-slate-400">
                Contacta con Kaviro para activar el modo agencia.
              </span>
            </>
          )}
        </span>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#162d4d]"
      >
        {hasAgency ? (
          <>
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            Modo agencia
          </>
        ) : (
          <>
            <Mail className="h-3.5 w-3.5" aria-hidden />
            Modo agencia
          </>
        )}
      </Link>
    </div>
  );
}
