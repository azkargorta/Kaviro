"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { TripActivity } from "@/hooks/useTripActivities";
import { buildTodayPlanWhatsAppText, whatsAppShareUrl } from "@/lib/today-plan-share";

export default function ShareTodayPlanButton({
  tripId,
  tripName,
  destination,
  hero = false,
}: {
  tripId: string;
  tripName: string;
  destination?: string | null;
  hero?: boolean;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const resp = await fetch(`/api/trip-activities?tripId=${encodeURIComponent(tripId)}`, {
        credentials: "include",
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
      const activities = (payload?.activities ?? []) as TripActivity[];
      const text = buildTodayPlanWhatsAppText({
        tripName,
        destination,
        activities,
      });
      const url = whatsAppShareUrl(text);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(
        "No se pudo preparar el plan",
        e instanceof Error ? e.message : "Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      setBusy(false);
    }
  }

  const heroClass =
    "inline-flex shrink-0 min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/90 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#F87171] shadow-sm transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:opacity-60";

  const defaultClass =
    "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/40";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void share()}
      className={hero ? heroClass : defaultClass}
      title="Enviar plan de hoy por WhatsApp"
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#F87171]" aria-hidden />
      {busy ? "Preparando…" : "Plan de hoy en WhatsApp"}
    </button>
  );
}
