import { freePlanBadge } from "@/lib/premium-copy";

type Props = {
  tripCount: number;
  isPremium: boolean;
  compact?: boolean;
  /** Header claro (dashboard v2) */
  neutral?: boolean;
};

export default function DashboardHeaderCopy({
  tripCount,
  isPremium,
  compact = false,
  neutral = false,
}: Props) {
  const subtitle =
    tripCount === 0
      ? "Tu biblioteca de viajes empieza con un solo plan."
      : `${tripCount} viaje${tripCount !== 1 ? "s" : ""} en tu biblioteca · planifica, viaja y recuerda.`;

  const planPill = isPremium ? (
    <span className="inline-flex items-center rounded-md bg-[var(--brand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-text)] ring-1 ring-[var(--brand-border)] sm:text-[11px]">
      Premium
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 sm:text-[11px] dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
      {freePlanBadge()}
    </span>
  );

  const legacyPlanPill = isPremium ? (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25 sm:text-[11px]">
      Premium
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25 sm:text-[11px]">
      {freePlanBadge()}
    </span>
  );

  if (neutral) {
    if (compact) {
      return (
        <div className="min-w-0 flex-1 border-l-2 border-[var(--brand)] pl-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-base">
              Mis viajes
            </h1>
            {planPill}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      );
    }
    return (
      <div className="pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Mis viajes</h1>
        <p className="mt-1 max-w-lg text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        <div className="mt-2">{planPill}</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative z-10 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-[10px]">
          Panel de viajes
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">Mis viajes</h1>
          {legacyPlanPill}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/80 sm:text-xs">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 pb-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Panel de viajes</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Mis viajes</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85">{subtitle}</p>
      <div className="mt-3">{legacyPlanPill}</div>
    </div>
  );
}
