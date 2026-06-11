type Props = {
  badge: string;
  className?: string;
};

export function tripStatusBadgeTone(
  badge: string
): "active" | "upcoming" | "past" | "pending" | "expense" | "default" {
  if (badge === "En curso") return "active";
  if (badge === "Próximo") return "upcoming";
  if (badge === "Finalizado") return "past";
  if (badge === "Pendiente") return "pending";
  if (badge === "Grupo de gastos") return "expense";
  return "default";
}

const TONE_CLASS: Record<ReturnType<typeof tripStatusBadgeTone>, string> = {
  active:
    "bg-[var(--brand-light)] text-[var(--brand-text)] ring-1 ring-[var(--brand-border)]",
  upcoming:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90 dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700",
  past: "bg-slate-50 text-slate-500 ring-1 ring-slate-200/70 dark:bg-slate-900/50 dark:text-slate-500 dark:ring-slate-800",
  pending:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-800/35",
  expense:
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700",
  default:
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700",
};

export default function TripStatusBadge({ badge, className = "" }: Props) {
  const tone = tripStatusBadgeTone(badge);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CLASS[tone]} ${className}`}
    >
      {badge === "En curso" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" aria-hidden />
      ) : null}
      {badge}
    </span>
  );
}
