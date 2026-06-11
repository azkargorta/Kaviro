import type { ReactNode } from "react";

type Variant = "brand" | "info" | "warning" | "danger";

const VARIANTS: Record<Variant, string> = {
  brand:
    "border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 dark:from-[#1a0f0f]/30 dark:via-[#0F1623] dark:to-[#080C14]",
  info: "border-slate-200 bg-slate-50 dark:border-[#334155] dark:bg-[#080C14]",
  warning: "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:to-[#0F1623]",
  danger: "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30",
};

type Props = {
  title?: string;
  children: ReactNode;
  variant?: Variant;
  actions?: ReactNode;
  className?: string;
};

export default function TripSoftCallout({
  title,
  children,
  variant = "brand",
  actions,
  className = "",
}: Props) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${VARIANTS[variant]} ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {title ? (
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">{title}</p>
          ) : null}
          <div className={`text-sm text-slate-700 dark:text-slate-300 ${title ? "mt-1" : ""}`}>{children}</div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
