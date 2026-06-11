import type { ReactNode } from "react";
import { TRIP_PANEL_SOFT } from "@/components/trip/ui/trip-ui-classes";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function TripEmptyState({ icon, title, description, action, className = "" }: Props) {
  return (
    <div className={`${TRIP_PANEL_SOFT} px-6 py-10 text-center ${className}`}>
      {icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-[#0F1623]">
          {icon}
        </div>
      ) : null}
      <p className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
