import { todayYMD } from "@/lib/trip-activity-visual";

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / (86400 * 1000)
  );
}

type Props = {
  startDate: string;
  endDate: string;
};

export default function TripProgressBar({ startDate, endDate }: Props) {
  const today = todayYMD();
  const total = daysBetween(startDate, endDate) + 1;
  const elapsed = Math.min(total, Math.max(0, daysBetween(startDate, today) + 1));
  const pct = Math.round((elapsed / total) * 100);

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
        <span>
          Día {elapsed} de {total}
        </span>
        <span className="tabular-nums text-[var(--brand-text)]">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/70 shadow-inner ring-1 ring-slate-200/80 dark:bg-[#1E293B] dark:ring-[#334155]">
        <div
          className="h-full rounded-full bg-[var(--brand)] shadow-[0_0_8px_rgba(248,113,113,0.35)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
