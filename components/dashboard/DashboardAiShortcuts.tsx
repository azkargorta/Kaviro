"use client";

import { Sparkles } from "lucide-react";
import { iconInline16 } from "@/components/ui/iconTokens";
import { openCreateTripForm } from "@/lib/open-create-trip";

export type DashboardAiTrip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

export default function DashboardAiShortcuts({
  trips,
  isPremium,
}: {
  trips: DashboardAiTrip[];
  isPremium: boolean;
}) {
  if (!isPremium) return null;

  if (trips.length === 0) {
    return (
      <p className="w-full text-center text-xs text-slate-500 sm:text-sm">
        Crea un viaje y podrás abrir el asistente con un clic desde aquí.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => openCreateTripForm()}
        className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-2 text-xs font-semibold text-[var(--brand-text)] shadow-sm transition hover:border-[var(--brand)]"
        title="Abre el formulario para crear un viaje; al guardar con Premium puedes seguir en el asistente"
      >
        <Sparkles className={`${iconInline16} text-[var(--brand)]`} aria-hidden />
        Crear viaje (manual)
      </button>
    </div>
  );
}
