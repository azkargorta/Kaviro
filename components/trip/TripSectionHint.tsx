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
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-100">
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 text-violet-700 hover:bg-violet-100 dark:text-violet-200"
        aria-label="Cerrar ayuda"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
