"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass, agencyCardClass } from "@/lib/agency-theme";
import { AGENCY_PARTNERSHIP_EMAIL, agencyPartnershipMailto } from "@/lib/brand";
import { AGENCY_PRO_MAX_MEMBERS, AGENCY_TRIAL_DAYS } from "@/lib/agency-plan";
import { AlertTriangle, CheckCircle2, CreditCard, ExternalLink, Loader2, Mail } from "lucide-react";

type Status = {
  plan: string;
  planLabel: string;
  active: boolean;
  trialEndsAt: string | null;
  maxMembers: number;
  selfServeCheckout: boolean;
  canUpgrade: boolean;
  canManageBilling?: boolean;
};

export default function AgencyPlanPanel() {
  const searchParams = useSearchParams();
  const billing = searchParams.get("billing");
  const message = searchParams.get("message");
  const reason = searchParams.get("reason");

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    fetch("/api/agencies/billing/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.plan) setStatus(json as Status);
      })
      .finally(() => setLoading(false));
  }, []);

  async function startCheckout() {
    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/agencies/billing/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "No se pudo iniciar el pago.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function openPortal() {
    setPortalBusy(true);
    try {
      const res = await fetch("/api/agencies/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "No se pudo abrir el portal de facturación.");
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={`${agencyCardClass} flex items-center justify-center gap-2 p-10 text-sm text-slate-500`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando plan…
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`${agencyCardClass} p-6 text-sm text-slate-600`}>
        No se pudo cargar el plan.
      </div>
    );
  }

  const trialEndLabel = status.trialEndsAt
    ? new Date(status.trialEndsAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      {reason === "plan-inactive" || !status.active ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mr-1.5 inline h-4 w-4 shrink-0" aria-hidden />
          {status.plan === "trial"
            ? "Tu prueba gratuita ha terminado. El panel está bloqueado hasta que actives Agency Pro o contactes con Kaviro."
            : "Tu plan no está activo. Actualiza la suscripción o contacta con soporte para recuperar el acceso."}
        </div>
      ) : null}

      {billing === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden />
          Pago recibido. Tu plan Agency Pro se activará en unos segundos.
        </div>
      ) : null}
      {billing === "error" && message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30">
          {message}
        </div>
      ) : null}

      <div className={`${agencyCardClass} p-6`}>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Plan actual</p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{status.planLabel}</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>
            Estado:{" "}
            <strong className={status.active ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700"}>
              {status.active ? "Activo" : "Inactivo"}
            </strong>
          </li>
          <li>
            Miembros del equipo: <strong>{status.maxMembers}</strong>
          </li>
          {status.plan === "trial" && trialEndLabel ? (
            <li>
              La prueba termina el <strong>{trialEndLabel}</strong> ({AGENCY_TRIAL_DAYS} días)
            </li>
          ) : null}
        </ul>

        {status.active && status.plan === "agency_pro" ? (
          <Link
            href="/agency"
            className={`${agencyBtnSecondaryClass} mt-5 inline-flex text-xs`}
          >
            Ir al panel
          </Link>
        ) : null}
      </div>

      {status.canManageBilling ? (
        <div className={`${agencyCardClass} p-6`}>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Suscripción Stripe</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cambia método de pago, descarga facturas o cancela la renovación.
          </p>
          <button
            type="button"
            disabled={portalBusy}
            onClick={() => void openPortal()}
            className={`${agencyBtnSecondaryClass} mt-4 gap-2 text-xs`}
          >
            {portalBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ExternalLink className="h-4 w-4" aria-hidden />
            )}
            Gestionar suscripción
          </button>
        </div>
      ) : null}

      {status.canUpgrade || !status.active ? (
        <div className={`${agencyCardClass} grid gap-6 p-6 md:grid-cols-2`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">Agency Pro</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Suscripción mensual</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Hasta {AGENCY_PRO_MAX_MEMBERS} miembros, portales ilimitados y todas las funciones del panel.
            </p>
            <button
              type="button"
              disabled={checkoutBusy || !status.selfServeCheckout}
              onClick={() => void startCheckout()}
              className={`${agencyBtnPrimaryClass} mt-5 gap-2`}
            >
              {checkoutBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CreditCard className="h-4 w-4" aria-hidden />
              )}
              {status.active ? "Pasar a Agency Pro" : "Activar Agency Pro"}
            </button>
            {!status.selfServeCheckout ? (
              <p className="mt-2 text-xs text-slate-500">Pago online en configuración. Usa el contacto de partnership.</p>
            ) : null}
          </div>
          <div className="border-t border-slate-100 pt-6 md:border-l md:border-t-0 md:pl-6 dark:border-[#334155]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Partnership</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              ¿Gestionas muchos grupos al año? Precio personalizado y onboarding dedicado.
            </p>
            <a href={agencyPartnershipMailto()} className={`${agencyBtnSecondaryClass} mt-5 inline-flex gap-2 text-xs`}>
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Hablar con Kaviro
            </a>
            <p className="mt-2 text-xs text-slate-500">{AGENCY_PARTNERSHIP_EMAIL}</p>
          </div>
        </div>
      ) : status.plan === "partnership" ? (
        <div className={`${agencyCardClass} p-6 text-sm text-slate-600 dark:text-slate-300`}>
          Tu plan está gestionado por acuerdo comercial. Para cambios:{" "}
          <a href={`mailto:${AGENCY_PARTNERSHIP_EMAIL}`} className="font-semibold text-[#1e3a5f] dark:text-sky-300">
            {AGENCY_PARTNERSHIP_EMAIL}
          </a>
        </div>
      ) : null}
    </div>
  );
}
