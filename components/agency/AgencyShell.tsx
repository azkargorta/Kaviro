"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AgencySidebar from "@/components/agency/AgencySidebar";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import SignOutButton from "@/components/auth/SignOutButton";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode";
import type { AgencyRow } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { agencyPanelBgClass, KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import { ArrowLeftRight } from "lucide-react";

export default function AgencyShell({
  agency,
  children,
}: {
  agency: AgencyRow;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "agency");
    } catch {
      /* */
    }
  }, [pathname]);

  return (
    <div
      className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} flex min-h-[100dvh] flex-col md:flex-row ${agencyPanelBgClass}`}
    >
      <AgencySidebar agency={agency} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[#0f2744] bg-[#1e3a5f] shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-safe-inline py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {KAVIRO_TRIPS_PRODUCT_NAME}
              </p>
              <p className="truncate text-sm font-semibold text-white">{agency.name}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                title="Ir a Kaviro personal"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Kaviro personal</span>
              </Link>
              <DarkModeToggle heroMode />
              <SignOutButton className="inline-flex min-h-9 items-center rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-safe-inline py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
