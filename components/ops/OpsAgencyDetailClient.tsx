"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Detail = {
  agency: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    contact_email: string | null;
    max_members: number;
    ownerLabel: string;
    billing_monthly_amount_cents?: number | null;
    billing_currency?: string | null;
    stripe_price_id_monthly?: string | null;
    billing_quote_notes?: string | null;
  };
  trips: Array<{ id: string; name: string; destination: string | null }>;
  members: Array<{ userId: string; role: string; label: string }>;
  notes: Array<{ id: string; body: string; authorLabel: string; createdAt: string }>;
  stats: { tripCount: number; emailLogCount: number };
  linkedLeads?: Array<{
    id: string;
    contact_name: string;
    email: string;
    status: string;
    created_at: string;
  }>;
};

export default function OpsAgencyDetailClient({ agencyId }: { agencyId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [billingMonthlyEur, setBillingMonthlyEur] = useState("");
  const [billingQuoteNotes, setBillingQuoteNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stripeProductOk, setStripeProductOk] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/agencies/${agencyId}`, { cache: "no-store" });
      const json = await res.json();
      if (json.needsMigration) throw new Error("Ejecuta docs/kaviro_platform_ops.sql");
      if (!res.ok) throw new Error(json.error);
      setData(json);
      const cents = json?.agency?.billing_monthly_amount_cents;
      setBillingMonthlyEur(
        typeof cents === "number" && cents > 0 ? String(cents / 100) : ""
      );
      setBillingQuoteNotes(json?.agency?.billing_quote_notes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch("/api/ops/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setStripeProductOk(Boolean(json.integrations?.stripeAgencyProduct)))
      .catch(() => setStripeProductOk(null));
  }, []);

  async function savePlan(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/ops/agencies/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ops/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, body: note }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />;
  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return null;

  const a = data.agency;

  return (
    <div className="space-y-6">
      <Link href="/ops/agencies" className="text-sm font-semibold text-slate-600 hover:underline">
        ← Agencias
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{a.name}</h2>
        <p className="text-sm text-slate-500">
          /client/{a.slug} · Owner: {a.ownerLabel}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            Plan
            <select
              value={a.plan}
              disabled={busy}
              onChange={(e) => void savePlan({ plan: e.target.value })}
              className="rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="partnership">partnership</option>
              <option value="agency_pro">agency_pro</option>
              <option value="trial">trial</option>
              <option value="suspended">suspended</option>
              <option value="free">free</option>
            </select>
          </label>
          <span className="text-slate-500">
            {data.stats.tripCount} viajes · {data.stats.emailLogCount} emails log
          </span>
          <a
            href={`/agency`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1e3a5f] underline dark:text-sky-300"
          >
            Abrir panel agencia (tu sesión)
          </a>
        </div>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tarifa Agency Pro (por agencia)</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Fija el precio mensual acordado al inicio. Se crea un Price en Stripe y la agencia lo verá en{" "}
          <code>/agency/plan</code> antes de pagar.
        </p>
        {stripeProductOk === false ? (
          <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30">
            Falta <code>STRIPE_AGENCY_PRODUCT_ID</code> en Vercel. Ver{" "}
            <code>docs/AGENCY_PRO_STRIPE_E2E.md</code>.
          </p>
        ) : null}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = Number.parseFloat(billingMonthlyEur.replace(",", "."));
            if (!Number.isFinite(amount)) {
              setError("Indica un importe mensual válido.");
              return;
            }
            void savePlan({
              billingMonthlyEur: amount,
              maxMembers: a.max_members,
              billingQuoteNotes,
            });
          }}
        >
          <label className="block text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Importe mensual (EUR)</span>
            <input
              type="number"
              min={1}
              step={0.01}
              value={billingMonthlyEur}
              onChange={(e) => setBillingMonthlyEur(e.target.value)}
              placeholder="89"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Miembros incluidos</span>
            <input
              type="number"
              min={1}
              max={50}
              value={a.max_members}
              onChange={(e) => void savePlan({ maxMembers: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Notas del acuerdo (interno)</span>
            <input
              value={billingQuoteNotes}
              onChange={(e) => setBillingQuoteNotes(e.target.value)}
              placeholder="Ej. 12 grupos/año, onboarding incluido"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Guardar tarifa y crear en Stripe
            </button>
            {a.stripe_price_id_monthly ? (
              <span className="font-mono text-xs text-slate-500">Price: {a.stripe_price_id_monthly}</span>
            ) : null}
          </div>
        </form>
      </section>

      {data.linkedLeads && data.linkedLeads.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leads de /empresa vinculados</h3>
            <Link href="/ops/leads" className="text-xs font-semibold text-[#1e3a5f] underline dark:text-sky-300">
              Ver todos los leads
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {data.linkedLeads.map((l) => (
              <li key={l.id} className="py-2 text-sm">
                <p className="font-medium text-slate-900 dark:text-white">{l.contact_name}</p>
                <p className="text-slate-600">
                  {l.email} · <span className="text-xs uppercase text-slate-500">{l.status}</span>
                </p>
                <p className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString("es-ES")}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notas internas</h3>
        <form onSubmit={(e) => void addNote(e)} className="mt-3 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Seguimiento comercial, llamada, etc."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Añadir
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {data.notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="text-slate-800 dark:text-slate-200">{n.body}</p>
              <p className="mt-1 text-xs text-slate-500">
                {n.authorLabel} · {new Date(n.createdAt).toLocaleString("es-ES")}
              </p>
            </li>
          ))}
          {data.notes.length === 0 ? <p className="text-xs text-slate-500">Sin notas.</p> : null}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold">Viajes recientes</h3>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {data.trips.map((t) => (
            <li key={t.id} className="px-4 py-2 text-sm">
              <span className="font-medium">{t.name}</span>
              {t.destination ? <span className="text-slate-500"> — {t.destination}</span> : null}
            </li>
          ))}
          {data.trips.length === 0 ? <li className="px-4 py-3 text-slate-500">Sin viajes.</li> : null}
        </ul>
      </section>
    </div>
  );
}
