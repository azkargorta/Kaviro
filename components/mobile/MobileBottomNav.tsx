"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import TripNavLink from "@/components/trip/nav/TripNavLink";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { getTripNavItems } from "@/lib/kaviro-trips-trip-nav";
import { TRIP_NAV_GROUPS, isTripNavActivePath } from "@/lib/trip-nav-groups";
import { TRIP_SIDEBAR_ICONS } from "@/lib/trip-sidebar-icons";
import type { TripTabKey } from "@/lib/trip-tab-assets";

type Props = {
  tripId: string;
  isPremium: boolean;
  startDate?: string | null;
  endDate?: string | null;
  unseenCount?: number;
  newParticipantCount?: number;
};

const PERSONAL_PRIMARY_KEYS: TripTabKey[] = ["summary", "plan", "participants", "resources"];
const EXPENSES_GROUP_PRIMARY_KEYS: TripTabKey[] = ["summary", "expenses", "participants"];
const AGENCY_PRIMARY_KEYS: TripTabKey[] = ["plan", "map", "resources"];

export default function MobileBottomNav({
  tripId,
  isPremium,
  startDate,
  endDate,
  unseenCount = 0,
  newParticipantCount = 0,
}: Props) {
  const pathname = usePathname();
  const { isAgencyTrip, isAgencyManaged, useAgencyBranding, tripMode } = useTripWorkspace();
  const [sheetOpen, setSheetOpen] = useState(false);

  const allNavItems = getTripNavItems(isAgencyTrip, isAgencyManaged, tripMode);
  const navItems = allNavItems.filter((item) => !item.isPremiumGated || isPremium);
  const primaryKeys = isAgencyTrip
    ? AGENCY_PRIMARY_KEYS
    : tripMode === "expenses"
      ? EXPENSES_GROUP_PRIMARY_KEYS
      : PERSONAL_PRIMARY_KEYS;
  const primaryItems = navItems.filter((item) => primaryKeys.includes(item.key));
  const secondaryItems = navItems.filter((item) => !primaryKeys.includes(item.key));

  const isPersonalKaviro = !isAgencyTrip && !useAgencyBranding;

  const isTripActiveToday = (() => {
    if (isAgencyTrip || !startDate || !endDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= startDate && today <= endDate;
  })();

  const isSecondaryActive = secondaryItems.some((item) =>
    isTripNavActivePath(pathname, item.href(tripId), item.key)
  );

  const accentDotClass = useAgencyBranding || !isAgencyTrip ? "bg-[var(--brand)]" : "bg-[#1e3a5f]";

  return (
    <>
      {sheetOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          aria-label="Cerrar menú"
          onClick={() => setSheetOpen(false)}
        />
      ) : null}

      {sheetOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[min(82dvh,640px)] overflow-y-auto rounded-t-[20px] border-t border-slate-200/80 bg-[#F6F7FB] pb-safe shadow-2xl dark:border-[#1E293B] dark:bg-[#080C14]">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-[#334155]" />

          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Más secciones
            </span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-white dark:hover:bg-[#141c2b]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)] dark:border-[#1E293B] dark:bg-[#0F1623]">
            <nav aria-label="Más secciones del viaje" className="space-y-5 px-2.5 py-3">
              {TRIP_NAV_GROUPS.map((group) => {
                const groupItems = secondaryItems.filter((item) => group.keys.includes(item.key));
                if (!groupItems.length) return null;
                return (
                  <div key={group.label}>
                    <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {groupItems.map((item) => (
                        <TripNavLink
                          key={item.key}
                          item={item}
                          tripId={tripId}
                          active={isTripNavActivePath(pathname, item.href(tripId), item.key)}
                          isAgencyTrip={isAgencyTrip}
                          useAgencyBranding={useAgencyBranding}
                          isPersonalKaviro={isPersonalKaviro}
                          showHoyBadge={item.key === "today" && isTripActiveToday}
                          onNavigate={() => setSheetOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/80 px-5 pb-6 pt-4 dark:border-[#1E293B]">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Modo oscuro</span>
            <DarkModeToggle />
          </div>
        </div>
      ) : null}

      <nav
        data-tour="mobile-bottom-nav"
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
        aria-label="Navegación del viaje"
      >
        <div className="mx-2 mb-1 rounded-[20px] border border-slate-200/80 bg-white shadow-[0_-2px_16px_rgba(15,23,42,0.08)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:shadow-[0_-2px_16px_rgba(0,0,0,0.35)]">
          <div className="flex">
            {primaryItems.map((item) => {
              const href = item.href(tripId);
              const active = isTripNavActivePath(pathname, href, item.key);
              const Icon = TRIP_SIDEBAR_ICONS[item.key];
              const isAI = item.key === "chat";

              return (
                <Link
                  key={item.key}
                  href={href}
                  prefetch
                  className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
                    active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                  title={item.label}
                >
                  {active ? (
                    <span
                      className={`absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-[14px] ${
                        isPersonalKaviro
                          ? "border border-[var(--brand-border)]/60 bg-gradient-to-br from-[#FFF1F1] to-white shadow-[0_2px_8px_rgba(248,113,113,0.1)] dark:from-[#1a1212]/80 dark:to-[#0F1623]"
                          : "bg-slate-100 dark:bg-[#1E293B]"
                      }`}
                      aria-hidden
                    />
                  ) : null}

                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
                      active
                        ? isPersonalKaviro
                          ? "border-[var(--brand-border)]/50 bg-white text-[var(--brand)] dark:bg-[#141c2b]"
                          : "border-transparent bg-transparent text-[var(--brand)]"
                        : "border-transparent bg-transparent text-slate-500 group-hover:text-[var(--brand)]"
                    }`}
                    aria-hidden
                  >
                    {Icon ? <Icon className="h-5 w-5" strokeWidth={2} /> : null}
                  </span>

                  <span
                    className={`relative z-10 max-w-full truncate px-1 text-[9px] font-semibold leading-snug tracking-wide ${
                      active
                        ? isPersonalKaviro || isAI
                          ? "font-bold text-[var(--brand-text)] dark:text-[var(--brand)]"
                          : "text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.key === "plan" && isTripActiveToday && !active ? (
                    <span
                      className={`absolute right-3 top-2 h-2 w-2 rounded-full ring-1 ring-white dark:ring-[#0F1623] ${accentDotClass}`}
                      aria-hidden
                    />
                  ) : null}

                  {item.key === "plan" && unseenCount > 0 && !active && !isTripActiveToday ? (
                    <span
                      className={`absolute right-3 top-2 h-2 w-2 animate-pulse rounded-full ring-1 ring-white dark:ring-[#0F1623] ${accentDotClass}`}
                      aria-hidden
                    />
                  ) : null}

                  {isAI && !isPremium && !active ? (
                    <span className="absolute right-2 top-1.5 rounded-md border border-[var(--brand-border)]/55 bg-[var(--brand-light)]/75 px-1 py-0 text-[7px] font-bold text-[var(--brand-text)]">
                      PRO
                    </span>
                  ) : null}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
                isSecondaryActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
              }`}
              aria-label="Más secciones"
            >
              {isSecondaryActive ? (
                <span
                  className={`absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-[14px] ${
                    isPersonalKaviro
                      ? "border border-[var(--brand-border)]/60 bg-gradient-to-br from-[#FFF1F1] to-white shadow-[0_2px_8px_rgba(248,113,113,0.1)] dark:from-[#1a1212]/80 dark:to-[#0F1623]"
                      : "bg-slate-100 dark:bg-[#1E293B]"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10 flex h-8 w-8 items-center justify-center text-slate-500" aria-hidden>
                <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="relative z-10 text-[9px] font-semibold leading-snug tracking-wide text-slate-500 dark:text-slate-400">
                Más
              </span>
              {newParticipantCount > 0 ? (
                <span
                  className={`absolute right-3 top-2 h-2 w-2 rounded-full ring-1 ring-white dark:ring-[#0F1623] ${accentDotClass}`}
                  aria-hidden
                />
              ) : null}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
