"use client";

import dynamic from "next/dynamic";

const TripAiChatView = dynamic(() => import("@/components/trip/ai/TripAiChatView"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-[#334155] dark:bg-[#080C14]"
      aria-busy="true"
    >
      Preparando importación con IA…
    </div>
  ),
});

type Props = {
  tripId: string;
  isPremium?: boolean;
  compact?: boolean;
};

/** Importación de dossier (PDF/imagen) → tarjetas de plan en viajes Kaviro Trips. */
export default function PlanDocumentImportPanel({ tripId, isPremium = true, compact = false }: Props) {
  if (!isPremium) return null;

  return (
    <div className={compact ? "w-full" : "w-full max-w-full"} data-tour="plan-document-import">
      <TripAiChatView
        tripId={tripId}
        isPremium={isPremium}
        assistantContext="plan"
        planImportOnly
      />
    </div>
  );
}
