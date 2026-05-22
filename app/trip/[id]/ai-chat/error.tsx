"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AiChatSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();
  const tripId = params?.id ?? "";

  useEffect(() => {
    console.error("[Kaviro] Error en asistente IA:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl dark:bg-red-950/20">
        ✨
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Asistente IA no disponible
      </h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        El asistente no ha podido cargarse. Puedes intentarlo de nuevo o volver al plan del viaje.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10px] text-slate-400">ref: {error.digest}</p>
      ) : null}
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Intentar de nuevo
        </button>
        <Link
          href={tripId ? `/trip/${tripId}/plan` : "/dashboard"}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-white"
        >
          Volver al plan
        </Link>
      </div>
    </div>
  );
}
