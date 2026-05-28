import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const HERO_BTN =
  "inline-flex shrink-0 min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/90 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#F87171] shadow-sm transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80";

type Props = {
  className?: string;
  variant?: "default" | "hero";
  /** Tour spotlight. */
  tour?: boolean;
};

export default function TripMisViajesLink({ className = "", variant = "default", tour = false }: Props) {
  const hero = variant === "hero";

  return (
    <Link
      href="/dashboard"
      {...(tour ? { "data-tour": "topbar-mis-viajes" } : {})}
      className={
        className || (hero ? HERO_BTN : "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--surface-card)] px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#1E293B] dark:text-slate-200 dark:hover:bg-[#1E293B]")
      }
      title="Volver al panel de viajes"
    >
      <ArrowLeft className={`shrink-0 text-[#F87171] ${hero ? "h-3.5 w-3.5" : "h-4 w-4"}`} aria-hidden />
      Mis viajes
    </Link>
  );
}
