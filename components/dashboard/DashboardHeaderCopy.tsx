import { freePlanBadge } from "@/lib/premium-copy";

type Props = {
  tripCount: number;
  isPremium: boolean;
  /** Barra superior en escritorio: tipografía más compacta */
  compact?: boolean;
};

export default function DashboardHeaderCopy({ tripCount, isPremium, compact = false }: Props) {
  const subtitle =
    tripCount === 0
      ? "Crea tu primer viaje y organiza plan, gastos y rutas en un solo lugar."
      : `Tienes ${tripCount} viaje${tripCount !== 1 ? "s" : ""} activo${tripCount !== 1 ? "s" : ""}. Elige uno para continuar planificando.`;

  const planPill = isPremium ? (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25 sm:text-[11px]">
      ✨ Premium activo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25 sm:text-[11px]">
      {freePlanBadge()}
    </span>
  );

  if (compact) {
    return (
      <div className="relative z-10 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-[10px]">
          Panel de viajes
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">Mis viajes</h1>
          {planPill}
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
      <div className="mt-3">{planPill}</div>
    </div>
  );
}
