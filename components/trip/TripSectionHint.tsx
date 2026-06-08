"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function TripSectionHint({
  tripId,
  sectionKey,
  message,
}: {
  tripId: string;
  sectionKey: string;
  message: string;
}) {
  const storageKey = `kaviro-section-hint-${tripId}-${sectionKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* */
    }
    setVisible(false);
  }

  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-100">
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1 text-violet-700 hover:bg-violet-100 dark:text-violet-200"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
