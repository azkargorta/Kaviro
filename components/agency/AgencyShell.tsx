"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import KaviroLogo from "@/components/brand/KaviroLogo";
import AgencySidebar from "@/components/agency/AgencySidebar";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import SignOutButton from "@/components/auth/SignOutButton";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode";
import type { AgencyRow } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
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
    <div className="flex min-h-[calc(100dvh-0px)] flex-col md:flex-row">
      <AgencySidebar agency={agency} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 border-b border-[#1e3a5f]/20 px-safe-inline py-3 shadow-sm"
          style={{
            background: `linear-gradient(90deg, ${agency.brand_color || "#1e3a5f"} 0%, #0f2744 100%)`,
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href="/agency" className="shrink-0" aria-label={KAVIRO_TRIPS_PRODUCT_NAME}>
              <KaviroLogo variant="light" size="sm" withWordmark />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                title="Ir al modo personal (tus viajes como viajero)"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Modo personal</span>
              </Link>
              <DarkModeToggle heroMode />
              <SignOutButton
                className="inline-flex min-h-9 items-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/20"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-safe-inline py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
