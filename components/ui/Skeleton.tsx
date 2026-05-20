/**
 * Skeleton — placeholder animado para estados de carga.
 * Uso: <Skeleton className="h-10 w-full rounded-xl" />
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

/** Skeleton de tarjeta completa con opcional header + cuerpo */
export function SkeletonCard({
  className = "",
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#0F1623] ${className}`}
    >
      <Skeleton className="mb-4 h-5 w-2/5 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 rounded ${i === rows - 1 ? "w-3/5" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}
