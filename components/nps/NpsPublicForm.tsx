"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Props = {
  token: string;
  tripName: string;
  travelerLabel: string;
  branding: { name: string; brandColor: string };
};

const CATEGORIES = [
  { key: "ratingHotel", label: "Alojamiento" },
  { key: "ratingTransport", label: "Transporte" },
  { key: "ratingActivities", label: "Actividades" },
  { key: "ratingOrganization", label: "Organización" },
  { key: "ratingValue", label: "Relación calidad-precio" },
] as const;

export default function NpsPublicForm({ token, tripName, travelerLabel, branding }: Props) {
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [allowTestimonial, setAllowTestimonial] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (npsScore == null) {
      setError("Selecciona una puntuación de 0 a 10.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/nps/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npsScore,
          ...ratings,
          comment,
          allowTestimonial,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold">¡Gracias por tu opinión!</h1>
        <p className="mt-2 text-sm text-slate-600">Tu feedback ayuda a {branding.name} a mejorar.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-6">
      <header
        className="rounded-xl px-6 py-5 text-white"
        style={{ background: `linear-gradient(135deg, ${branding.brandColor}, #0f2744)` }}
      >
        <p className="text-xs uppercase tracking-wider opacity-80">{branding.name}</p>
        <h1 className="text-xl font-bold">¿Cómo fue tu viaje?</h1>
        <p className="mt-1 text-sm opacity-90">
          {tripName} · {travelerLabel}
        </p>
      </header>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">
          ¿Recomendarías {branding.name} a un amigo? (0 = nada, 10 = muchísimo)
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNpsScore(i)}
              className={`h-9 w-9 rounded-md text-sm font-bold transition ${
                npsScore === i ? "text-white" : "bg-slate-100 text-slate-700"
              }`}
              style={npsScore === i ? { backgroundColor: branding.brandColor } : undefined}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {CATEGORIES.map((c) => (
            <div key={c.key}>
              <p className="text-xs font-medium text-slate-600">{c.label}</p>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatings((r) => ({ ...r, [c.key]: n }))}
                    className={`h-8 w-8 rounded text-xs font-semibold ${
                      ratings[c.key] === n ? "bg-slate-800 text-white" : "bg-slate-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-600">Comentario (opcional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={allowTestimonial}
            onChange={(e) => setAllowTestimonial(e.target.checked)}
            className="mt-0.5"
          />
          Podemos usar tu valoración (sin datos personales) en nuestra web
        </label>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-white disabled:opacity-70"
          style={{ backgroundColor: branding.brandColor }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar valoración
        </button>
      </div>
    </form>
  );
}
