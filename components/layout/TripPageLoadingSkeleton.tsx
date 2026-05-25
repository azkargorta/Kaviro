/** Skeleton ligero mientras carga el contenido de una pestaña del viaje (el layout/hero se mantienen). */
export default function TripPageLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-40 rounded-lg bg-slate-200 dark:bg-[#1E293B]" />
      <div className="space-y-3">
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
      </div>
    </div>
  );
}
