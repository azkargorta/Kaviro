import type { ReactNode } from "react";

export type TripStatusPillVariant =
  | "past"
  | "current"
  | "upcoming"
  | "paid"
  | "pending"
  | "settle"
  | "shared"
  | "uploaded"
  | "neutral";

const STYLES: Record<TripStatusPillVariant, string> = {
  past: "border-slate-200 bg-slate-100 text-slate-500 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-400",
  current: "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]",
  upcoming: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
  pending: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
  settle: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200",
  shared: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200",
  uploaded: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
  neutral: "border-slate-200 bg-white text-slate-700 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300",
};

const LABELS: Record<TripStatusPillVariant, string> = {
  past: "Hecha",
  current: "Ahora",
  upcoming: "Próxima",
  paid: "Pagado",
  pending: "Pendiente",
  settle: "Por liquidar",
  shared: "Compartido",
  uploaded: "Subido",
  neutral: "",
};

type Props = {
  variant: TripStatusPillVariant;
  label?: string;
  icon?: ReactNode;
  className?: string;
};

export default function TripStatusPill({ variant, label, icon, className = "" }: Props) {
  const text = label ?? LABELS[variant];
  if (!text) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${STYLES[variant]} ${className}`}
    >
      {icon}
      {text}
    </span>
  );
}
