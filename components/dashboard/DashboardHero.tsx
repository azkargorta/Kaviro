import { freePlanBadge } from "@/lib/premium-copy";

type Props = {
  tripCount: number;
  isPremium: boolean;
};

export default function DashboardHero({ tripCount, isPremium }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-6 shadow-sm md:px-7 md:py-7"
      style={{
        background: "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #DC2626 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <span
          className="absolute -bottom-8 left-1/4 h-28 w-28 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
          Panel de viajes
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          Mis viajes
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85">
          {tripCount === 0
            ? "Crea tu primer viaje y organiza plan, gastos y rutas en un solo lugar."
            : `Tienes ${tripCount} viaje${tripCount !== 1 ? "s" : ""} activo${tripCount !== 1 ? "s" : ""}. Elige uno para continuar planificando.`}
        </p>
        {isPremium ? (
          <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
            ✨ Premium activo
          </span>
        ) : (
          <span className="mt-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
            {freePlanBadge()}
          </span>
        )}
      </div>
    </div>
  );
}
