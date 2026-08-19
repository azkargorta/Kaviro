"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; text: string };

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export default function PlannerChat({ messages, onSend, loading = false, disabled = false, placeholder }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || loading || disabled) return;
    setInput("");
    onSend(msg);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <Sparkles className="w-3 h-3 text-violet-500" />
              </div>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-100 text-slate-800 dark:bg-[#0F1623] dark:border-[#1E293B] dark:text-slate-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5 mr-2">
              <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Pensando…</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 dark:border-[#1E293B] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading || disabled}
            rows={2}
            placeholder={placeholder || "Escribe aquí…"}
            className="max-h-36 min-h-[2.75rem] flex-1 min-w-0 resize-none overflow-y-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-slate-500 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623]"
          />
          <button
            type="button"
            disabled={loading || disabled || !input.trim()}
            onClick={handleSend}
            className="btn-primary mb-0.5 shrink-0 px-3.5 py-2.5 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
