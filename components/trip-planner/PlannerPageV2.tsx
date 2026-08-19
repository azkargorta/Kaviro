"use client";

import { useState } from "react";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import PlannerChat from "./PlannerChat";
import PlannerSkeleton from "./PlannerSkeleton";
import PlannerPreview from "./PlannerPreview";
import TripAiPlannerInterview from "./TripAiPlannerInterview";
import type { PlannerBrief } from "@/lib/trip-ai/plannerBrief";
import { buildPlannerFreeText, plannerDestinationsForGenerate, resolvePlannerBriefDates } from "@/lib/trip-ai/plannerBrief";
import type { TripBrief, TripSkeleton as SkeletonType, TripItinerary } from "@/lib/trip-planner/types";

type ChatMessage = { role: "user" | "assistant"; text: string };
type Step = "interview" | "skeleton" | "generating" | "preview";

function briefFromInterview(ib: PlannerBrief): TripBrief | null {
  const dests = plannerDestinationsForGenerate(ib);
  const dates = resolvePlannerBriefDates(ib);
  if (!dests.length || !dates) return null;
  return {
    destinations: dests,
    sleepBases: ib.sleepBases.length ? ib.sleepBases : dests,
    startDate: dates.startDate,
    endDate: dates.endDate,
    arrival: { place: ib.arrival.place, date: dates.startDate, time: ib.arrival.time },
    departure: { place: ib.departure.place, date: dates.endDate, time: ib.departure.time },
    transport: ib.transport,
    pace: ib.pace,
    travelersType: ib.travelersType,
    travelerCount: ib.travelerCount,
    interests: ib.interests,
    avoid: ib.avoid,
    mustDo: ib.mustDo,
    constraints: ib.constraints,
    freeText: buildPlannerFreeText(ib),
  };
}

export default function PlannerPageV2() {
  const [step, setStep] = useState<Step>("interview");
  const [brief, setBrief] = useState<TripBrief | null>(null);
  const [skeleton, setSkeleton] = useState<SkeletonType | null>(null);
  const [skeletonText, setSkeletonText] = useState<string | null>(null);
  const [stops, setStops] = useState<Array<{ label: string; center: { lat: number; lng: number } }>>([]);
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProposeSkeleton(interviewBrief: PlannerBrief) {
    const tb = briefFromInterview(interviewBrief);
    if (!tb) return;
    setBrief(tb);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips/planner/skeleton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinations: tb.destinations,
          sleepBases: tb.sleepBases,
          startDate: tb.startDate,
          endDate: tb.endDate,
          arrivalPlace: tb.arrival.place,
          arrivalTime: tb.arrival.time,
          departurePlace: tb.departure.place,
          departureTime: tb.departure.time,
          transport: tb.transport,
          pace: tb.pace,
          travelersType: tb.travelersType,
          travelerCount: tb.travelerCount,
          interests: tb.interests,
          avoid: tb.avoid,
          mustDo: tb.mustDo,
          constraints: tb.constraints,
          freeText: tb.freeText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar esqueleto.");
      setSkeleton(data.skeleton);
      setSkeletonText(data.skeletonText);
      setStops(data.stops || []);
      setChatMessages([{ role: "assistant", text: data.skeletonText }]);
      setStep("skeleton");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenSkeleton() {
    if (!brief) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips/planner/skeleton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al regenerar.");
      setSkeleton(data.skeleton);
      setSkeletonText(data.skeletonText);
      setStops(data.stops || []);
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.skeletonText }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDetail() {
    if (!brief || !skeleton) return;
    setGenerating(true);
    setError(null);
    setStep("generating");
    try {
      const res = await fetch("/api/trips/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, skeleton, stops }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar itinerario.");
      setItinerary(data.itinerary);
      setPreviewMessages([{ role: "assistant", text: "Aquí tienes el itinerario completo. ¿Quieres modificar algo antes de crear el viaje?" }]);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
      setStep("skeleton");
    } finally {
      setGenerating(false);
    }
  }

  function handleChatSend(text: string) {
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", text: "Para aplicar cambios al esqueleto, pulsa «Rehacer esqueleto» (próximamente: edición en chat)." },
    ]);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-1">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Nuevo planificador</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Planificador inteligente v2
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-md">
          Primero organiza el esqueleto (noches y anclas), luego rellena el día a día. Tú decides si creas el viaje.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {step === "interview" && (
        <TripAiPlannerInterview
          generating={false}
          proposing={loading}
          skeletonText={null}
          onClassic={() => {}}
          onProposeSkeleton={handleProposeSkeleton}
          onGenerate={handleProposeSkeleton}
        />
      )}

      {step === "skeleton" && skeleton && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="space-y-4">
            <PlannerSkeleton skeleton={skeleton} />
            <div className="flex gap-3">
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateDetail}
                className="btn-primary flex items-center gap-2 py-3 px-5 text-sm disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generar itinerario detallado
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleRegenSkeleton}
                className="btn-secondary flex items-center gap-2 py-3 px-4 text-sm disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rehacer esqueleto
              </button>
            </div>
          </div>
          <div className="card-soft flex flex-col sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Ajustar esqueleto</p>
              <p className="text-xs text-slate-400 mt-0.5">Pide cambios en el chat o rehaz el esqueleto.</p>
            </div>
            <PlannerChat
              messages={chatMessages}
              onSend={handleChatSend}
              loading={loading}
              placeholder="Ej. Una noche más en Cafayate…"
            />
          </div>
        </div>
      )}

      {step === "generating" && (
        <div className="card-soft p-10 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-sm font-semibold text-slate-600">Generando itinerario completo…</p>
          <p className="text-xs text-slate-400">Esto puede tardar 30-50 segundos.</p>
        </div>
      )}

      {step === "preview" && itinerary && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
          <PlannerPreview
            itinerary={itinerary}
            onCreateTrip={() => alert("Próximamente: crear viaje desde aquí")}
            onDownloadPdf={() => alert("Próximamente: descargar PDF")}
          />
          <div className="card-soft flex flex-col sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">¿Quieres cambiar algo?</p>
              <p className="text-xs text-slate-400 mt-0.5">Dime qué modificar y regenero el itinerario.</p>
            </div>
            <PlannerChat
              messages={previewMessages}
              onSend={(text) => {
                setPreviewMessages((prev) => [...prev, { role: "user", text }]);
                setPreviewMessages((prev) => [
                  ...prev,
                  { role: "assistant", text: "Entendido. Pulsa «Regenerar itinerario» para aplicar tus cambios." },
                ]);
              }}
              loading={generating}
              placeholder="Ej. Cambia el restaurante del día 3…"
            />
            <div className="px-4 py-3 border-t border-slate-100 dark:border-[#1E293B] flex gap-2">
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateDetail}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                Regenerar
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => setStep("skeleton")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-2"
              >
                Volver al esqueleto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
