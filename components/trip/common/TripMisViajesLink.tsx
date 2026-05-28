import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  className?: string;
  /** Tour spotlight (sidebar escritorio o hoja «Más» en móvil). */
  tour?: boolean;
};

export default function TripMisViajesLink({ className = "", tour = false }: Props) {
  return (
    <Link
      href="/dashboard"
      {...(tour ? { "data-tour": "topbar-mis-viajes" } : {})}
      className={
        className ||
        "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--surface-card)] px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#1E293B] dark:text-slate-200 dark:hover:bg-[#1E293B]"
      }
      title="Volver al panel de viajes"
    >
      <ArrowLeft className="h-4 w-4 shrink-0 text-[#F87171]" aria-hidden />
      Mis viajes
    </Link>
  );
}
