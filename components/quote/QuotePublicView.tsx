"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { quotePdfPath } from "@/lib/agency/quotes";

type Line = {
  label: string;
  categoryLabel: string;
  description: string | null;
  unit_amount: number;
  quantity: number;
};

type Props = {
  token: string;
  branding: { name: string; brandColor: string };
  quote: {
    title: string;
    clientLabel: string | null;
    currency: string;
    validUntil: string | null;
    notes: string | null;
    discountPercent: number;
    discountLabel: string | null;
  };
  trip: { name: string; destination: string | null; start_date: string | null; end_date: string | null } | null;
  lines: Line[];
  totals: { subtotal: number; discountAmount: number; total: number; pricePerPerson: number | null };
};

function formatMoney(n: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(n);
}

export default function QuotePublicView({ token, branding, quote, trip, lines, totals }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState("");

  async function submit(action: "accept" | "reject") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/quote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDone(action === "accept" ? "accepted" : "rejected");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (done === "accepted") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Presupuesto aceptado</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gracias, {name}. {branding.name} confirmará los siguientes pasos por email.
        </p>
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">Has indicado que no aceptas esta propuesta. Puedes contactar con la agencia si lo necesitas.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header
        className="rounded-t-2xl px-6 py-5 text-white"
        style={{ background: `linear-gradient(135deg, ${branding.brandColor}, #0f2744)` }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{branding.name}</p>
        <h1 className="mt-1 text-2xl font-bold">{quote.title}</h1>
        {quote.clientLabel ? <p className="mt-1 text-sm opacity-90">{quote.clientLabel}</p> : null}
        {trip ? (
          <p className="mt-2 text-sm opacity-80">
            {trip.name}
            {trip.destination ? ` · ${trip.destination}` : ""}
          </p>
        ) : null}
        {quote.validUntil ? (
          <p className="mt-2 text-xs opacity-70">Válida hasta {quote.validUntil}</p>
        ) : null}
      </header>

      <div className="space-y-4 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-500">
              <th className="pb-2">Concepto</th>
              <th className="pb-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2.5">
                  <span className="font-medium text-slate-900">{l.label}</span>
                  <span className="ml-1 text-xs text-slate-400">({l.categoryLabel})</span>
                  {l.description ? <p className="text-xs text-slate-500">{l.description}</p> : null}
                </td>
                <td className="py-2.5 text-right tabular-nums text-slate-700">
                  {formatMoney(Number(l.unit_amount) * Number(l.quantity), quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotal, quote.currency)}</span>
          </div>
          {totals.discountAmount > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Descuento ({quote.discountPercent}%)</span>
              <span>-{formatMoney(totals.discountAmount, quote.currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(totals.total, quote.currency)}</span>
          </div>
          {totals.pricePerPerson != null ? (
            <p className="text-right text-xs text-slate-500">
              {formatMoney(totals.pricePerPerson, quote.currency)} / persona
            </p>
          ) : null}
        </div>

        {quote.notes ? (
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{quote.notes}</p>
        ) : null}

        <Link
          href={quotePdfPath(token)}
          target="_blank"
          className="block text-center text-xs font-semibold underline"
          style={{ color: branding.brandColor }}
        >
          Descargar / imprimir PDF
        </Link>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">Confirmar propuesta</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit("accept")}
              className="inline-flex flex-1 min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white disabled:opacity-70"
              style={{ backgroundColor: branding.brandColor }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aceptar presupuesto
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit("reject")}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
