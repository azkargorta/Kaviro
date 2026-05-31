"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { tripAssistantSurfaceFromPathname, tripAssistantSurfaceLabel } from "@/lib/trip-assistant-context";
import {
  TRIP_ASSISTANT_OPEN_EVENT,
  type TripAssistantOpenDetail,
} from "@/lib/trip-assistant-events";
import {
  KAVIRO_TRIP_PLAN_REFRESH_EVENT,
  dispatchTripPlanRefresh,
  type TripPlanRefreshDetail,
} from "@/lib/trip-plan-events";
import type { TripAiMode } from "@/lib/trip-ai/buildPrompt";
import { iconSlotFab56, iconSlotFill40 } from "@/components/ui/iconTokens";
import TripAiAssistantErrorBoundary from "@/components/trip/ai/TripAiAssistantErrorBoundary";

const TripAiChatView = dynamic(() => import("@/components/trip/ai/TripAiChatView"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">Cargando asistente…</div>
  ),
});

type Props = {
  tripId: string;
  isPremium: boolean;
};

export default function TripPageAssistantDock({ tripId, isPremium }: Props) {
  const pathname = usePathname();
  const surface = useMemo(() => tripAssistantSurfaceFromPathname(pathname), [pathname]);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [chatMountKey, setChatMountKey] = useState(0);
  const [assistantLogoOk, setAssistantLogoOk] = useState(true);
  const [launchPayload, setLaunchPayload] = useState<{
    initialMessage: string;
    mode?: TripAiMode;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onAssistantOpen(event: Event) {
      const detail = (event as CustomEvent<TripAssistantOpenDetail>).detail;
      if (!detail || detail.tripId !== tripId) return;
      if (!detail.initialMessage?.trim()) return;
      setLaunchPayload({
        initialMessage: detail.initialMessage.trim(),
        mode: detail.mode,
      });
      setChatMountKey((k) => k + 1);
      setOpen(true);
    }

    window.addEventListener(TRIP_ASSISTANT_OPEN_EVENT, onAssistantOpen);
    return () => window.removeEventListener(TRIP_ASSISTANT_OPEN_EVENT, onAssistantOpen);
  }, [tripId]);

  useEffect(() => {
    function onPlanRefresh(event: Event) {
      const detail = (event as CustomEvent<TripPlanRefreshDetail>).detail;
      if (!detail?.tripId || detail.tripId !== tripId) return;
      if (detail.closeAssistant) {
        setOpen(false);
        setLaunchPayload(null);
      }
    }
    window.addEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
    return () => window.removeEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
  }, [tripId]);

  function closeDock() {
    setOpen(false);
    setLaunchPayload(null);
    if (surface === "plan") {
      dispatchTripPlanRefresh(tripId);
    }
  }

  const fullscreenHref = useMemo(() => {
    const base = `/trip/${encodeURIComponent(tripId)}/ai-chat`;
    if (surface === "routes") return `${base}?modo=desplazamientos`;
    if (surface === "resources") return `${base}?modo=documentos`;
    if (surface === "expenses") return `${base}?modo=gastos`;
    if (surface === "plan") return `${base}?modo=planificador`;
    return base;
  }, [surface, tripId]);

  if (!mounted || !isPremium || !surface) return null;

  const surfaceLabel = tripAssistantSurfaceLabel(surface);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-[1090] inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg ring-2 ring-white/20 transition hover:bg-slate-800 md:bottom-8 md:right-6 dark:bg-[#F87171] dark:ring-[#F87171]/30 dark:hover:bg-[#EF4444] dark:shadow-[0_4px_20px_rgba(248,113,113,0.35)] ${iconSlotFab56}`}
        aria-label={`Abrir asistente personal (${surfaceLabel})`}
        title={`Asistente personal · ${surfaceLabel}`}
      >
        {assistantLogoOk ? (
          <Image
            src="/brand/assistant-logo.png"
            alt=""
            width={56}
            height={56}
            className="h-9 w-9 object-contain"
            priority
            onError={() => setAssistantLogoOk(false)}
          />
        ) : (
          <MessageCircle aria-hidden />
        )}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1100] flex w-full min-w-0 max-md:flex-col md:items-center md:justify-end md:overflow-x-hidden md:p-6">
          <button
            type="button"
            className="absolute inset-0 hidden bg-slate-950/45 backdrop-blur-[2px] md:block"
            aria-label="Cerrar asistente personal"
            onClick={closeDock}
          />
          <div
            className="relative flex h-[100dvh] max-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-hidden border-slate-200 bg-white shadow-2xl max-md:rounded-none max-md:border-0 md:max-h-[min(88dvh,820px)] md:w-full md:max-w-[560px] md:rounded-3xl md:border dark:border-[#1E293B] dark:bg-[#0F1623]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-assistant-dock-title"
          >
            <div className="flex shrink-0 min-w-0 flex-col gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3 dark:border-[#1E293B] dark:bg-[#0D1117]">
              <div className="min-w-0 pr-1">
                <p id="trip-assistant-dock-title" className="break-words text-sm font-bold text-slate-950 dark:text-white">
                  Asistente · {surfaceLabel}
                </p>
                <p className="mt-0.5 hidden break-words text-xs leading-snug text-slate-600 sm:block dark:text-slate-400">
                  Modo alineado con esta pestaña; puedes cambiar el modo manual si lo necesitas.
                </p>
              </div>
              <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
                <Link
                  href={fullscreenHref}
                  className="hidden min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 md:inline-flex dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-[#334155]"
                  onClick={closeDock}
                >
                  Pantalla completa
                </Link>
                <button
                  type="button"
                  onClick={closeDock}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200 dark:hover:bg-[#334155] ${iconSlotFill40}`}
                  aria-label="Cerrar"
                >
                  <X aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden p-2 sm:p-4">
              <TripAiAssistantErrorBoundary onReset={() => setChatMountKey((k) => k + 1)}>
                <TripAiChatView
                  key={`${surface}-${chatMountKey}`}
                  tripId={tripId}
                  isPremium={isPremium}
                  layout="drawer"
                  assistantContext={surface}
                  initialPrompt={launchPayload?.initialMessage ?? null}
                  initialPromptMode={launchPayload?.mode ?? null}
                />
              </TripAiAssistantErrorBoundary>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
