"use client";
// Dark toggle visible on mobile

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { iconSlotNavBottom } from "@/components/ui/iconTokens";
import { getTripTabIconSrc, tripTabDocsImageClass, tripTabIconCoralFilterDark, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

type Props = {
  tripId: string;
  isPremium: boolean;
};

const items: Array<{ key: TripTabKey; label: string; href: (id: string) => string; isAI?: boolean }> = [
  {
    key: "summary",
    label: "Inicio",
    href: (id) => `/trip/${id}/summary`,
  },
  {
    key: "plan",
    label: "Plan",
    href: (id) => `/trip/${id}/plan`,
  },
  {
    key: "map",
    label: "Rutas",
    href: (id) => `/trip/${id}/map`,
  },
  {
    key: "expenses",
    label: "Gastos",
    href: (id) => `/trip/${id}/expenses`,
  },
  {
    key: "participants",
    label: "Gente",
    href: (id) => `/trip/${id}/participants`,
  },
  {
    key: "resources",
    label: "Docs",
    href: (id) => `/trip/${id}/resources`,
  },
  {
    key: "chat",
    label: "IA",
    href: (id) => `/trip/${id}/ai-chat`,
    isAI: true,
  },
];

export default function MobileBottomNav({ tripId, isPremium }: Props) {
  const pathname = usePathname();
  const isDark = useIsDarkMode();
  const isTripActiveToday = (() => {
    if (!startDate || !endDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= startDate && today <= endDate;
  })();

  const visibleItems = isPremium ? items : items.filter((i) => i.key !== "chat");

  function isActivePath(href: string, key: string) {
    if (pathname === href) return true;
    if (key === "map" && pathname.startsWith(`${href}/`)) return true;
    return false;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
      aria-label="Navegación del viaje"
    >
      {/* Dark mode toggle — fixed top-right on mobile, hidden on desktop */}
      <div className="pointer-events-none absolute -top-14 right-3 pointer-events-auto">
        <DarkModeToggle />
      </div>
      <div className="mx-2 mb-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-[var(--surface-card)]/96 shadow-[0_-4px_24px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex">
          {visibleItems.map((item) => {
            const href = item.href(tripId);
            const active = isActivePath(href, item.key);

            return (
              <Link
                key={item.key}
                href={href}
                className={`
                  relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px]
                  transition-all duration-150
                  ${active ? "text-slate-950" : "text-slate-500 hover:text-slate-700"}
                `}
                title={item.label}
              >
                {/* Active pill bg */}
                {active && (
                  <span
                    className={`
                      absolute inset-x-1 top-1 bottom-1 rounded-xl
                      ${item.isAI
                        ? "bg-[var(--brand-light)]"
                        : "bg-slate-100"
                      }
                    `}
                    aria-hidden
                  />
                )}

                {/* Icon */}
                <span
                  className={`
                    relative z-10 flex h-6 w-6 items-center justify-center transition-transform duration-150
                    ${active ? "scale-110" : ""}
                    ${item.isAI && active ? "[filter:hue-rotate(0deg)_saturate(1.5)_brightness(0.9)]" : ""}
                  `}
                  aria-hidden
                >
                  <Image
                    src={getTripTabIconSrc(item.key, isDark)}
                    alt=""
                    width={24}
                    height={24}
                    sizes="24px"
                    className={`object-contain ${tripTabIconCoralFilterDark} ${item.key === "resources" ? tripTabDocsImageClass : ""}`}
                  />
                </span>

                {/* Label */}
                <span
                  className={`
                    relative z-10 text-[9px] font-semibold leading-none tracking-wide
                    ${active
                      ? item.isAI ? "text-[var(--brand)]" : "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* HOY dot — shown on Plan item during active trip */}
                {item.key === "plan" && isTripActiveToday && !active && (
                  <span className="absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-[#F87171] ring-1 ring-white dark:ring-[#080C14]" aria-hidden />
                )}

                {/* Active dot */}
                {active && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${"bg-[var(--brand)]"}`}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
