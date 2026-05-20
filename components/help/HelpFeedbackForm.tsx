"use client";

import { useState } from "react";
import { FEEDBACK_CATEGORIES, SUPPORT_EMAIL, buildFeedbackMailto, type FeedbackCategory } from "@/lib/help-center";
import { MessageSquare } from "lucide-react";

export default function HelpFeedbackForm() {
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) return;

    const mailto = buildFeedbackMailto({
      category,
      message: trimmed,
      contactEmail: contactEmail.trim() || undefined,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });

    window.location.href = mailto;
    setSent(true);
    setMessage("");
  }

  return (
    <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
          <MessageSquare className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Enviar feedback</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Cuéntanos un error, una idea o un problema con IA/OCR. Se abrirá tu cliente de correo hacia{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[var(--brand)] hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tipo
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="mt-1.5 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm dark:bg-[#0F1623]"
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tu email (opcional)
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="para responderte"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm dark:bg-[#0F1623]"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Mensaje
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            rows={5}
            placeholder="Describe qué pasó, qué esperabas y pasos para reproducirlo…"
            className="mt-1.5 w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2.5 text-sm dark:bg-[#0F1623]"
          />
        </label>
        <button
          type="submit"
          disabled={message.trim().length < 10}
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
        >
          Abrir correo para enviar
        </button>
        {sent ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Si no se abrió el correo, escribe manualmente a {SUPPORT_EMAIL}.
          </p>
        ) : null}
      </form>
    </section>
  );
}
