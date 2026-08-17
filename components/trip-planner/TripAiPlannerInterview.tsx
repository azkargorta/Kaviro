"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";
import {
  emptyPlannerBrief,
  plannerBriefSummaryLines,
  type PlannerBrief,
} from "@/lib/trip-ai/plannerBrief";

type ChatMessage = { role: "user" | "assistant"; text: string };

type InterviewResponse = {
  ok?: boolean;
  error?: string;
  brief?: PlannerBrief;
  readyToPropose?: boolean;
  proposedSleepBases?: string[];
  assistantReply?: string;
};

type Props = {
  onGenerate: (brief: PlannerBrief) => void;
  onClassic: () => void;
  generating?: boolean;
};

export default function TripAiPlannerInterview({ onGenerate, onClassic, generating = false }: Props) {
  const [brief, setBrief] = useState<PlannerBrief>(emptyPlannerBrief);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [bases, setBases] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/trips/ai-planner/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: true }),
        });
        const data = (await res.json()) as InterviewResponse;
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "No se pudo iniciar.");
        setMessages([{ role: "assistant", text: data.assistantReply || "" }]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo iniciar el chat.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading || generating) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/trips/ai-planner/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, brief }),
      });
      const data = (await res.json()) as InterviewResponse;
      if (!res.ok) throw new Error(data.error || "No se pudo continuar.");
      if (data.brief) setBrief(data.brief);
      setReady(Boolean(data.readyToPropose));
      setBases(data.proposedSleepBases || []);
      setMessages((prev) => [...prev, { role: "assistant", text: data.assistantReply || "De acuerdo." }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al hablar con el asistente.");
    } finally {
      setLoading(false);
    }
  }

  const summary = plannerBriefSummaryLines(brief);

  return (
    <div className="card-soft flex min-h-[32rem] flex-col overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-[#1E293B]">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Cuéntame tu viaje</span>
        </div>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Escribe con naturalidad. Te pregunto solo lo que falte para proponerte un itinerario y un PDF antes de crear el
          viaje.
        </p>
      </div>

      {summary.length ? (
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-600 dark:border-[#1E293B] dark:bg-[#0a0e14] dark:text-slate-300">
          {summary.map((line) => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Sparkles className="h-3 w-3 text-violet-500" />
              </div>
            ) : null}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-100 bg-slate-50 text-slate-800 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {(loading || generating) && (
          <div className="flex justify-start">
            <div className="mr-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {generating ? "Generando la propuesta…" : "Pensando…"}
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {bases.length > 0 && !ready ? (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-[#1E293B]">
          <p className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500">
            <MapPin className="h-3 w-3" /> Posibles bases para dormir — elige las que te encajen
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bases.map((b) => (
              <button
                key={b}
                type="button"
                disabled={loading}
                onClick={() => void send(`Quiero dormir en ${b}`)}
                className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-40"
              >
                {b}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => void send(`Quiero dormir en ${bases.join(", ")}`)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Usar todas
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="px-4 pb-2 text-xs font-semibold text-red-700">{error}</p> : null}

      <div className="border-t border-slate-100 px-4 py-3 dark:border-[#1E293B]">
        {ready ? (
          <>
            <button
              type="button"
              disabled={generating}
              onClick={() => onGenerate(brief)}
              className="btn-primary mb-3 flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generar propuesta de itinerario
            </button>
            <p className="mb-3 text-center text-xs text-slate-500">
              Luego podrás descargar un PDF y decidir si creas el viaje o lo retocas en el chat.
            </p>
          </>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={loading || generating}
            rows={2}
            placeholder={
              ready
                ? "¿Quieres cambiar algo de la ficha antes de generar?"
                : "Ej. Salta y Jujuy en coche, llego el 6 a las 20:00…"
            }
            className="max-h-36 min-h-[2.75rem] min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-slate-500 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623]"
          />
          <button
            type="button"
            disabled={loading || generating || !input.trim()}
            onClick={() => void send()}
            className="btn-primary mb-0.5 shrink-0 px-3.5 py-2.5 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onClassic}
          className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          Prefiero el formulario clásico
        </button>
      </div>
    </div>
  );
}
