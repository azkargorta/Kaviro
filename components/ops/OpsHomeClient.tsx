"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

type Integrations = {
  stripeSecret: boolean;
  stripeWebhook: boolean;
  stripeAgencyProduct: boolean;
  resend: boolean;
  appUrl: boolean;
  adminEmails: boolean;
  agencyProReady: boolean;
};

export default function OpsHomeClient() {
  const [counts, setCounts] = useState<{
    agencies: number;
    leadsNew: number;
    tripsB2b: number;
    pricingPending?: number;
  } | null>(null);
  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [pricingPending, setPricingPending] = useState(0);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ops/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.needsMigration) {
          setNeedsMigration(true);
          return;
        }
        if (data.error) throw new Error(data.error);
        setCounts(data.counts);
        setPricingPending(data.pricingPending ?? 0);
        setIntegrations(data.integrations ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (needsMigration) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Ejecuta <code>docs/kaviro_platform_ops.sql</code> en Supabase para activar leads y notas CRM.
      </p>
    );
  }

  if (!counts) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Vista global de agencias B2B y solicitudes de acceso.{" "}
        <Link href="/ops/migrations" className="font-semibold text-amber-800 underline dark:text-amber-300">
          Comprobar migraciones SQL →
        </Link>
      </p>

      {integrations && !integrations.agencyProReady ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30">
          <AlertTriangle className="mr-1.5 inline h-4 w-4 shrink-0" aria-hidden />
          Agency Pro (Stripe) incompleto en el servidor. Revisa integraciones abajo y{" "}
          <code className="rounded bg-white/60 px-1 dark:bg-black/20">docs/AGENCY_PRO_STRIPE_E2E.md</code>.
        </div>
      ) : null}

      {pricingPending > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30">
          <strong>{pricingPending}</strong> agencia{pricingPending === 1 ? "" : "s"} en prueba sin tarifa asignada.{" "}
          <Link href="/ops/agencies" className="font-bold underline">
            Configurar en Agencias →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/ops/agencies"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencias</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{counts.agencies}</p>
        </Link>
        <Link
          href="/ops/leads"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Leads nuevos
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950 dark:text-amber-100">{counts.leadsNew}</p>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Viajes B2B</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{counts.tripsB2b}</p>
        </div>
      </div>

      {integrations ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Integraciones (Vercel)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Solo indica si la variable está configurada; no muestra valores secretos.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <IntegrationRow ok={integrations.stripeAgencyProduct} label="STRIPE_AGENCY_PRODUCT_ID" required />
            <IntegrationRow ok={integrations.stripeSecret} label="STRIPE_SECRET_KEY" required />
            <IntegrationRow ok={integrations.stripeWebhook} label="STRIPE_WEBHOOK_SECRET" required />
            <IntegrationRow ok={integrations.appUrl} label="NEXT_PUBLIC_APP_URL" required />
            <IntegrationRow ok={integrations.resend} label="RESEND_API_KEY" />
            <IntegrationRow ok={integrations.adminEmails} label="KAVIRO_ADMIN_EMAILS" />
          </ul>
          {integrations.agencyProReady ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Listo para asignar tarifas y cobrar Agency Pro
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function IntegrationRow({
  ok,
  label,
  required,
}: {
  ok: boolean;
  label: string;
  required?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
      )}
      <span className={ok ? "text-slate-700 dark:text-slate-300" : "font-medium text-rose-800 dark:text-rose-300"}>
        <code className="text-xs">{label}</code>
        {required && !ok ? <span className="ml-1 text-xs text-rose-600">requerida</span> : null}
      </span>
    </li>
  );
}
