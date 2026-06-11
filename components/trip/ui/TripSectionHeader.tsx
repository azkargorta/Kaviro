import type { ReactNode } from "react";
import { TRIP_SECTION_LABEL } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function TripSectionHeader({ eyebrow, title, description, actions, className = "" }: Props) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className={TRIP_SECTION_LABEL}>{eyebrow}</p> : null}
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
