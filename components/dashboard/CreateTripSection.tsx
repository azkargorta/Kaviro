"use client";

import { useCallback, useEffect, useState } from "react";
import CreateTripForm from "./CreateTripForm";
import DashboardCreateTripCta from "./DashboardCreateTripCta";
import Link from "next/link";
import { FREE_TRIP_LIMIT, freeTripLimitMessage } from "@/lib/premium-copy";
import type { CreateTripOpenMode } from "@/lib/open-create-trip";

export default function CreateTripSection({
  isPremium,
  tripCount,
}: {
  isPremium: boolean;
  tripCount: number;
}) {
  const locked = !isPremium && tripCount >= FREE_TRIP_LIMIT;
  const [showForm, setShowForm] = useState(false);
  const [initialMode, setInitialMode] = useState<CreateTripOpenMode>("travel");

  const syncOpenFromHash = useCallback(() => {
    if (locked) return;
    try {
      const hash = window.location.hash;
      if (hash === "#create-trip-expenses") {
        setInitialMode("expenses");
        setShowForm(true);
      } else if (hash === "#create-trip") {
        setInitialMode("travel");
        setShowForm(true);
      }
    } catch {
      /* */
    }
  }, [locked]);

  useEffect(() => {
    syncOpenFromHash();
    window.addEventListener("hashchange", syncOpenFromHash);
    return () => window.removeEventListener("hashchange", syncOpenFromHash);
  }, [syncOpenFromHash]);

  useEffect(() => {
    const open = (event: Event) => {
      if (locked) return;
      const mode = (event as CustomEvent<{ mode?: CreateTripOpenMode }>).detail?.mode;
      setInitialMode(mode === "expenses" ? "expenses" : "travel");
      setShowForm(true);
    };
    window.addEventListener("kaviro:open-create-trip", open);
    return () => window.removeEventListener("kaviro:open-create-trip", open);
  }, [locked]);

  return (
    <div className="space-y-3">
      {locked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <div>
            {freeTripLimitMessage()}
          </div>
          <div className="mt-2">
            <Link
              href="/account?upgrade=premium&focus=premium#premium-plans"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Mejorar a Premium
            </Link>
          </div>
        </div>
      ) : showForm ? (
        <div className="space-y-3">
          <CreateTripForm isPremium={isPremium} initialMode={initialMode} />
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-300"
          >
            Cerrar formulario
          </button>
        </div>
      ) : (
        <DashboardCreateTripCta />
      )}
    </div>
  );
}
