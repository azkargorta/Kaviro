import Link from "next/link";
import type { ReactNode } from "react";
import { TRIP_TILE_CARD, TRIP_TILE_CARD_HIGHLIGHT } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
  valueClassName?: string;
  className?: string;
};

export default function TripStatCard({
  icon,
  label,
  value,
  href,
  highlight = false,
  valueClassName = "",
  className = "",
}: Props) {
  const cardClass = `${highlight ? TRIP_TILE_CARD_HIGHLIGHT : TRIP_TILE_CARD} p-3.5 ${className}`;
  const inner = (
    <>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300 dark:ring-slate-700"
        }`}
      >
        {icon}
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={`mt-1 truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white ${valueClassName}`}
        >
          {value}
        </p>
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
