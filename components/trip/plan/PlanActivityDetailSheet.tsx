"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PlanActivityCard from "@/components/trip/plan/PlanActivityCard";
import PlanLodgingCard from "@/components/trip/plan/PlanLodgingCard";
import type { TripActivity } from "@/hooks/useTripActivities";
import { isLodgingPlanActivity } from "@/lib/plan-activity-meta";

type Props = {
  activity: TripActivity | null;
  onClose: () => void;
  premiumEnabled?: boolean;
  tripId: string;
  currentUserId?: string | null;
  currentDisplayName?: string;
  canManagePlan?: boolean;
  onEdit?: (activity: TripActivity) => void;
  onDelete?: (activity: TripActivity) => void;
};

export default function PlanActivityDetailSheet({
  activity,
  onClose,
  premiumEnabled = false,
  tripId,
  currentUserId = null,
  currentDisplayName = "Yo",
  canManagePlan = true,
  onEdit,
  onDelete,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activity) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activity]);

  useEffect(() => {
    if (!activity) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activity, onClose]);

  if (!mounted || !activity) return null;

  const isLodging = isLodgingPlanActivity(activity);

  return createPortal(
    <div className="fixed inset-0 z-[2100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-950/45" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-10 max-h-[min(88vh,720px)] w-full max-w-lg overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#1E293B]">
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">Detalle de actividad</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:text-slate-300"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(min(88vh,720px)-3.5rem)] overflow-y-auto p-4">
          {isLodging ? (
            <PlanLodgingCard activity={activity} onEdit={canManagePlan ? onEdit : undefined} onDelete={canManagePlan ? onDelete : undefined} />
          ) : (
            <PlanActivityCard
              activity={activity}
              onEdit={canManagePlan ? onEdit : undefined}
              onDelete={canManagePlan ? onDelete : undefined}
              premiumEnabled={premiumEnabled}
              tripId={tripId}
              currentUserId={currentUserId}
              displayName={currentDisplayName}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
