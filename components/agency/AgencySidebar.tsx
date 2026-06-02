"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutGrid, Layers, Palette, Users } from "lucide-react";
import type { AgencyRow } from "@/lib/agency";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
}> = [
  { href: "/agency", label: "Viajes", icon: LayoutGrid, exact: true },
  { href: "/agency/clients", label: "Clientes", icon: Building2 },
  { href: "/agency/templates", label: "Plantillas", icon: Layers },
  { href: "/agency/team", label: "Equipo", icon: Users },
  { href: "/agency/branding", label: "Marca", icon: Palette },
];

export default function AgencySidebar({ agency }: { agency: AgencyRow }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-[#1e3a5f] bg-[#0f2744] md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-white/10 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {KAVIRO_TRIPS_PRODUCT_NAME}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-white">{agency.name}</p>
      </div>

      <nav className="flex gap-0.5 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible md:px-2">
        {NAV.map((item) => {
          const active =
            item.exact === true ? pathname === item.href : Boolean(pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/12 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
