"use client";

import Link from "next/link";
import { Eye, X } from "lucide-react";
import { exitTravelerPreviewHref } from "@/lib/trip-traveler-preview";

export default function TripTravelerPreviewBanner({ tripId }: { tripId: string }) {
  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
    >
      <p className="flex min-w-0 items-center gap-2 font-medium">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          Vista previa como <strong>viajero en Kaviro</strong> (menú y pantallas del grupo invitado).
        </span>
      </p>
      <Link
        href={exitTravelerPreviewHref(tripId)}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-900 transition hover:bg-sky-100 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-100 dark:hover:bg-slate-800"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Volver a gestión
      </Link>
    </div>
  );
}
