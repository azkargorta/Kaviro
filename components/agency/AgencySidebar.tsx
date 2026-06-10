"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Building2,
  Globe,
  LayoutGrid,
  Layers,
  Map,
  Palette,
  BarChart3,
  CalendarDays,
  CreditCard,
  Users,
  Sparkles,
} from "lucide-react";
import type { AgencyRow } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { AGENCY_NAVY, agencyNavLinkClass } from "@/lib/agency-theme";

function agencyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (parts[0]?.slice(0, 3) || "KT").toUpperCase();
}

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
}> = [
  { href: "/agency", label: "Panel", icon: LayoutGrid, exact: true },
  { href: "/agency/trips", label: "Mis viajes", icon: Map },
  { href: "/agency/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/agency/templates", label: "Plantillas", icon: Layers },
  { href: "/agency/clients", label: "Clientes", icon: Building2 },
  { href: "/agency/finance", label: "Cobros", icon: CreditCard },
  { href: "/agency/portals", label: "Portales", icon: Globe },
  { href: "/agency/reports", label: "Informes", icon: BarChart3 },
  { href: "/agency/team", label: "Equipo", icon: Users },
  { href: "/agency/branding", label: "Branding", icon: Palette },
  { href: "/agency/plan", label: "Plan", icon: Sparkles },
];

export default function AgencySidebar({
  agency,
  logoUrl,
}: {
  agency: AgencyRow;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const initials = agencyInitials(agency.name);

  return (
    <aside className="flex w-full flex-col border-b border-[#0f2744] bg-[#0f2744] md:sticky md:top-0 md:h-screen md:overflow-y-auto md:w-[248px] md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10">
              <Image src={logoUrl} alt="" fill className="object-contain p-0.5" sizes="36px" />
            </div>
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ring-1 ring-white/20"
              style={{ backgroundColor: AGENCY_NAVY }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase leading-normal tracking-[0.12em] text-slate-400">
              {KAVIRO_TRIPS_PRODUCT_NAME}
            </p>
            <p className="truncate text-base font-semibold leading-snug text-white">{agency.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto overflow-y-visible px-2 py-3 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-4">
        {NAV.map((item) => {
          const active =
            item.exact === true
              ? pathname === "/agency"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${agencyNavLinkClass} ${
                active
                  ? "bg-[#1e3a5f]/80 font-semibold text-white ring-1 ring-white/15"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90 md:h-5 md:w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
