/** Skeleton del dashboard: título y resumen van en RootTopBar. */
export default function DashboardLoadingSkeleton() {
  return (
    <main className="page-shell pb-8 md:pb-10" aria-busy="true" aria-label="Cargando panel">
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/90 dark:border-[#1E293B] dark:bg-[#1E293B]/60"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#1E293B]/80" style={{ animationDelay: "160ms" }} />
      </div>
    </main>
  );
}
