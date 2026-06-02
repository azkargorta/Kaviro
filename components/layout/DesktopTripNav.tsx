"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getTripTabIconSrc, tripTabDocsImageClass, tripTabIconCoralFilterDark, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

type Props = {
  tripId: string;
  isPremium: boolean;
};

const items: Array<{
  key: TripTabKey;
  label: string;
  href: (id: string) => string;
}> = [
  {
    key: "summary",
    label: "Resumen",
    href: (id: string) => `/trip/${id}/summary`,
  },
  {
    key: "plan",
    label: "Plan",
    href: (id: string) => `/trip/${id}/plan`,
  },
  {
    key: "map",
    label: "Rutas",
    href: (id: string) => `/trip/${id}/map`,
  },
  { key: "expenses", label: "Gastos", href: (id: string) => `/trip/${id}/expenses` },
  { key: "participants", label: "Gente", href: (id: string) => `/trip/${id}/participants` },
  { key: "messages", label: "Mensajes", href: (id: string) => `/trip/${id}/messages` },
  {
    key: "resources",
    label: "Docs",
    href: (id: string) => `/trip/${id}/resources`,
  },
  { key: "chat", label: "Asistente personal", href: (id: string) => `/trip/${id}/ai-chat` },
  { key: "settings", label: "Ajustes", href: (id: string) => `/trip/${id}/settings` },
];

function isActivePath(pathname: string, href: string, key: string) {
  if (pathname === href) return true;
  // En rutas internas bajo /map, mantenemos «Rutas» activo.
  if (key === "map" && pathname.startsWith(`${href}/`)) return true;
  if (key === "settings" && pathname.startsWith(href)) return true;
  return false;
}

export default function DesktopTripNav({ tripId, isPremium }: Props) {
  const pathname = usePathname();
  const isDark = useIsDarkMode();
  const visibleItems = isPremium ? items : items.filter((item) => item.key !== "chat");

  return (
    <nav
      className="fixed inset-x-0 top-[56px] z-40 hidden border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:block dark:border-[#1E293B] dark:bg-[#0F1623]/95"
      aria-label="Navegación del viaje"
    >
      <div className="page-shell max-w-[1200px] !py-2">
        <div className="flex flex-wrap gap-2">
          {visibleItems.map((item) => {
            const href = item.href(tripId);
            const active = isActivePath(pathname, href, item.key);
            return (
              <Link
                key={item.key}
                href={href}
                prefetch
                className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-violet-200 bg-violet-50 text-violet-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
                }`}
              >
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center" aria-hidden>
                  <Image
                    src={getTripTabIconSrc(item.key, isDark)}
                    alt=""
                    width={22}
                    height={22}
                    sizes="22px"
                    className={`h-[22px] w-[22px] object-contain ${tripTabIconCoralFilterDark} ${item.key === "resources" ? tripTabDocsImageClass : ""}`}
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

