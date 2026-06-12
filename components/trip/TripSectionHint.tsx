"use client";

import { X } from "lucide-react";

export default function TripSectionHint({
  message,
  open,
  onClose,
}: {
  tripId: string;
  sectionKey: string;
  message: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs leading-snug text-slate-600 dark:border-[#334155] dark:bg-[#141c2b]/60 dark:text-slate-300">
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
        aria-label="Cerrar ayuda"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
