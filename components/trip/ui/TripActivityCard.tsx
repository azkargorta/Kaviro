import type { ReactNode } from "react";
import type { ActivityVisualState } from "@/lib/trip-activity-visual";
import TripStatusPill from "@/components/trip/ui/TripStatusPill";

type Props = {
  children: ReactNode;
  state?: ActivityVisualState;
  badge?: ReactNode;
  className?: string;
  onClick?: () => void;
};

const STATE_SHELL: Record<ActivityVisualState, string> = {
  past: "border border-dashed border-slate-200 bg-slate-100/90 dark:border-[#334155] dark:bg-[#0a0e14]/50",
  current:
    "border border-[var(--brand-border)] bg-white shadow-[0_4px_16px_rgba(248,113,113,0.12)] ring-1 ring-[var(--brand-border)]/40 dark:bg-[#141c2b]",
  upcoming: "border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] dark:border-[#334155] dark:bg-[#0F1623]",
  default: "border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:border-[#334155] dark:bg-[#141c2b]",
};

const STATE_PILL: Partial<Record<ActivityVisualState, "past" | "current" | "upcoming">> = {
  past: "past",
  current: "current",
  upcoming: "upcoming",
};

export default function TripActivityCard({ children, state = "default", badge, className = "", onClick }: Props) {
  const pill = STATE_PILL[state];
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`relative rounded-xl px-4 py-3.5 transition ${STATE_SHELL[state]} ${interactive ? "cursor-pointer hover:border-slate-300" : ""} ${className}`}
    >
      {pill ? (
        <span className="absolute right-3 top-3">
          {badge ?? <TripStatusPill variant={pill} />}
        </span>
      ) : badge ? (
        <span className="absolute right-3 top-3">{badge}</span>
      ) : null}
      {children}
    </div>
  );
}
