"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutGrid,
  Layers,
  Palette,
  Users,
} from "lucide-react";
import type { AgencyRow } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
}> = [
  { href: "/agency", label: "Mis viajes", icon: LayoutGrid, exact: true },
  { href: "/agency/templates", label: "Plantillas", icon: Layers },
  { href: "/agency/team", label: "Equipo", icon: Users },
  { href: "/agency/branding", label: "Branding", icon: Palette },
];

export default function AgencySidebar({ agency }: { agency: AgencyRow }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-slate-200/80 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-[#1E293B]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
            <Briefcase className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {KAVIRO_TRIPS_PRODUCT_NAME}
            </p>
            <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">{agency.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible md:px-3">
        {NAV.map((item) => {
          const active =
            item.exact === true ? pathname === item.href : Boolean(pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-[#1e3a5f]/25 dark:text-sky-200"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1E293B]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
