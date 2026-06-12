import Link from "next/link";
import type { ReactNode } from "react";
import { TRIP_TILE_CARD, TRIP_TILE_CARD_HIGHLIGHT } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  href?: string;
  highlight?: boolean;
  valueClassName?: string;
  className?: string;
};

export default function TripStatCard({
  icon,
  label,
  value,
  subtitle,
  href,
  highlight = false,
  valueClassName = "",
  className = "",
}: Props) {
  const cardClass = `${highlight ? TRIP_TILE_CARD_HIGHLIGHT : TRIP_TILE_CARD} p-3.5 ${className}`;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            highlight
              ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300 dark:ring-slate-700"
          }`}
        >
          {icon}
        </div>
        {href ? (
          <span className="text-slate-300 transition group-hover:text-[var(--brand)]" aria-hidden>
            →
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={`mt-1 truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white ${valueClassName}`}
        >
          {value}
        </p>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
