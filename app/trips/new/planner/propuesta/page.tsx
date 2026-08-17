"use client";

import { useEffect, useState } from "react";
import PrintOnLoad from "@/app/share/[token]/pdf/PrintOnLoad";
import PlannerProposalPrint from "@/components/trip-planner/PlannerProposalPrint";
import { loadPlannerProposalSnapshot, type PlannerProposalSnapshot } from "@/lib/trip-ai/plannerProposalStorage";

export default function PlannerProposalPdfPage() {
  const [snapshot, setSnapshot] = useState<PlannerProposalSnapshot | null>(() =>
    typeof window === "undefined" ? null : loadPlannerProposalSnapshot()
  );

  useEffect(() => {
    setSnapshot(loadPlannerProposalSnapshot());
  }, []);

  if (!snapshot) {
    return (
      <main className="p-8 text-sm text-slate-600">
        No hay una propuesta para imprimir. Vuelve al planificador, genera el itinerario y pulsa «Descargar PDF».
      </main>
    );
  }

  return (
    <>
      <PrintOnLoad />
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <p>
          En el diálogo de impresión elige <strong>Guardar como PDF</strong>. Luego vuelve al planificador para crear el
          viaje o pedir cambios en el chat.
        </p>
        <button type="button" onClick={() => window.print()} className="btn-primary shrink-0 px-4 py-2 text-sm">
          Imprimir / guardar PDF
        </button>
      </div>
      <PlannerProposalPrint snapshot={snapshot} />
    </>
  );
}
