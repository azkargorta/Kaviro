"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Field = {
  field_key: string;
  label: string;
  field_type: string;
  required: boolean;
  options?: string[] | null;
};

type Props = {
  token: string;
  tripName: string;
  travelerName: string;
  fields: Field[];
  initialAnswers: Record<string, string>;
  alreadySubmitted: boolean;
  brandColor: string;
  agencyName: string;
};

export default function PretravelPublicForm({
  token,
  tripName,
  travelerName,
  fields,
  initialAnswers,
  alreadySubmitted,
  brandColor,
  agencyName,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pretravel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-slate-900">¡Gracias, {travelerName}!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hemos recibido tus datos para <strong>{tripName}</strong>. {agencyName} los revisará antes del viaje.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header
        className="rounded-t-2xl px-6 py-5 text-white"
        style={{ background: `linear-gradient(135deg, ${brandColor}, #0f2744)` }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{agencyName}</p>
        <h1 className="mt-1 text-xl font-bold">Datos pre-viaje</h1>
        <p className="mt-1 text-sm opacity-90">
          {tripName} · {travelerName}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-6 shadow-sm"
      >
        {fields.map((f) => (
          <label key={f.field_key} className="block">
            <span className="text-sm font-semibold text-slate-700">
              {f.label}
              {f.required ? <span className="text-red-500"> *</span> : null}
            </span>
            {f.field_type === "textarea" ? (
              <textarea
                required={f.required}
                rows={3}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.field_key]: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            ) : f.field_type === "select" ? (
              <select
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.field_key]: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.field_type === "date" ? "date" : f.field_type === "email" ? "email" : "text"}
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [f.field_key]: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            )}
          </label>
        ))}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-white disabled:opacity-70"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar formulario
        </button>
      </form>
    </div>
  );
}
