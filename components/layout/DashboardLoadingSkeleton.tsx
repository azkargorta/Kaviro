/** Skeleton del dashboard: título y resumen van en RootTopBar. */
export default function DashboardLoadingSkeleton() {
  return (
    <main className="page-shell animate-pulse space-y-4 pb-8 md:space-y-5 md:pb-10" aria-busy="true" aria-label="Cargando panel">
      <div className="mx-auto max-w-2xl space-y-3 px-4">
        <div className="h-20 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
      </div>
    </main>
  );
}
