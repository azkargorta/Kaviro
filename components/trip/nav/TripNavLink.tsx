"use client";

import Link from "next/link";
import type { TripNavItem } from "@/lib/kaviro-trips-trip-nav";
import { TRIP_SIDEBAR_ICONS } from "@/lib/trip-sidebar-icons";

type Props = {
  item: TripNavItem;
  tripId: string;
  active: boolean;
  isAgencyTrip: boolean;
  useAgencyBranding: boolean;
  isPersonalKaviro: boolean;
  showHoyBadge?: boolean;
  onNavigate?: () => void;
};

export default function TripNavLink({
  item,
  tripId,
  active,
  isAgencyTrip,
  useAgencyBranding,
  isPersonalKaviro,
  showHoyBadge = false,
  onNavigate,
}: Props) {
  const href = item.href(tripId);
  const Icon = TRIP_SIDEBAR_ICONS[item.key];
  const useKaviroPremium = isPersonalKaviro;
  const useAgencyAccent = useAgencyBranding || (isAgencyTrip && !useAgencyBranding);

  return (
    <Link
      href={href}
      prefetch
      title={item.label}
      onClick={onNavigate}
      className={`
        group relative flex min-h-[58px] items-center gap-3 rounded-[14px] border px-3 py-2.5
        transition-all duration-200
        ${
          active
            ? useKaviroPremium
              ? "border-[var(--brand-border)]/70 bg-gradient-to-br from-[#FFF1F1] to-white text-slate-900 shadow-[0_2px_12px_rgba(248,113,113,0.1)] dark:from-[#1a1212]/80 dark:to-[#0F1623] dark:text-white"
              : useAgencyAccent
                ? "border-transparent bg-[var(--brand)] text-white shadow-sm"
                : "border-transparent bg-[#1e3a5f] text-white shadow-sm"
            : useKaviroPremium
              ? "border-transparent text-slate-800 hover:-translate-y-px hover:border-slate-200/80 hover:bg-slate-50/90 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)] dark:text-slate-100 dark:hover:border-[#334155] dark:hover:bg-[#141c2b]/80"
              : "border-transparent text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#141c2b]"
        }
      `}
    >
      {active && useKaviroPremium ? (
        <span
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[var(--brand)]"
          aria-hidden
        />
      ) : null}

      <span
        className={`
          relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border
          ${
            active
              ? useKaviroPremium
                ? "border-[var(--brand-border)]/50 bg-white text-[var(--brand)] dark:bg-[#141c2b]"
                : "border-white/20 bg-white/15 text-white"
              : useKaviroPremium
                ? "border-slate-200/70 bg-slate-50/90 text-slate-500 group-hover:border-slate-200 group-hover:text-[var(--brand)] dark:border-[#334155] dark:bg-[#141c2b]/60 dark:text-slate-400 dark:group-hover:text-[var(--brand)]"
                : "border-slate-200/70 bg-slate-50/90 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        `}
        aria-hidden
      >
        {Icon ? <Icon className="h-5 w-5" strokeWidth={2} aria-hidden /> : null}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] leading-snug ${
            active
              ? useKaviroPremium
                ? "font-bold text-slate-900 dark:text-white"
                : "font-semibold text-white"
              : "font-semibold text-slate-900 dark:text-slate-100"
          }`}
        >
          {item.label}
        </p>
        {item.sublabel ? (
          <p
            className={`mt-0.5 truncate text-[10px] font-medium leading-snug ${
              active
                ? useKaviroPremium
                  ? "text-slate-400 dark:text-slate-500"
                  : useAgencyAccent || isAgencyTrip
                    ? "text-white/75"
                    : "text-slate-500"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {item.sublabel}
          </p>
        ) : null}
      </div>

      {showHoyBadge && !active ? (
        <span className="shrink-0 rounded-md border border-[var(--brand-border)]/55 bg-[var(--brand-light)]/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--brand-text)]">
          HOY
        </span>
      ) : null}
    </Link>
  );
}
