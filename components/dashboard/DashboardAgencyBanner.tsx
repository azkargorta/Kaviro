"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode";

export default function DashboardAgencyBanner() {
  const [agencyName, setAgencyName] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY) === "agency") {
        /* usuario volvió a personal desde agency — no forzar banner */
      }
    } catch {
      /* */
    }
    let cancelled = false;
    fetch("/api/agencies/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { agency?: { name?: string } | null }) => {
        if (cancelled) return;
        if (data.agency?.name) {
          setAgencyName(data.agency.name);
        } else {
          setAgencyName(null);
          try {
            localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "personal");
          } catch {
            /* */
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!agencyName) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-4 py-3 dark:border-sky-900/40 dark:bg-[#1e3a5f]/10">
      <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
        <Briefcase className="h-4 w-4 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
        <span>
          Tienes acceso a <strong>{KAVIRO_TRIPS_PRODUCT_NAME}</strong> ({agencyName}).
        </span>
      </div>
      <Link
        href="/agency"
        className="inline-flex min-h-9 items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#162d4d]"
      >
        Abrir {KAVIRO_TRIPS_PRODUCT_NAME}
      </Link>
    </div>
  );
}
