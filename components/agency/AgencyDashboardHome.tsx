"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AgencyTripListRow } from "@/lib/agency";
import AgencyTripRowItem from "@/components/agency/AgencyTripRow";
import AgencyCreateTripForm from "@/components/agency/AgencyCreateTripForm";
import AgencyInstantiateFromTemplateModal from "@/components/agency/AgencyInstantiateFromTemplateModal";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
} from "@/lib/agency-theme";
import { AGENCY_PARTNERSHIP_EMAIL, agencyPartnershipMailto } from "@/lib/brand";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, CreditCard, Layers, UserPlus } from "lucide-react";

type Props = {
  agencyName: string;
  agencySlug: string;
  userDisplayName: string;
  trips: AgencyTripListRow[];
  clientCount: number;
  templateCount: number;
  portalViews30d: number;
  publishedPortals: number;
  upcomingCount: number;
  memberCount: number;
  maxMembers: number;
  pendingInvites: number;
  hasBranding: boolean;
};

type PaymentOverview = {
  totals?: { collected: number; pending: number; counts: { pending: number } };
  needsMigration?: boolean;
};

function categorize(trips: AgencyTripListRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  const active: AgencyTripListRow[] = [];
  const upcoming: AgencyTripListRow[] = [];
  const past: AgencyTripListRow[] = [];

  for (const t of trips) {
    const s = t.start_date;
    const e = t.end_date;
    if (s && e && s <= today && today <= e) active.push(t);
    else if (s && s > today) upcoming.push(t);
    else if (e && e < today) past.push(t);
    else active.push(t);
  }
  return { active, upcoming, past };
}

const QUICK_LINKS = [
  { href: "/agency/trips", title: "Mis viajes", desc: "Listado completo y filtros" },
  { href: "/agency/clients", title: "Clientes", desc: "CRM y grupos" },
  { href: "/agency/portals", title: "Portales", desc: "Publicar programa" },
  { href: "/agency/branding", title: "Marca", desc: "Logo y color corporativo" },
  { href: "/agency/team", title: "Equipo", desc: "Invitar colaboradores" },
  { href: "/agency/finance", title: "Cobros", desc: "Pagos de viajeros" },
] as const;

export default function AgencyDashboardHome({
  agencyName,
  agencySlug,
  userDisplayName,
  trips,
  clientCount,
  templateCount,
  portalViews30d,
  publishedPortals,
  upcomingCount,
  memberCount,
  maxMembers,
  pendingInvites,
  hasBranding,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showFromTemplate, setShowFromTemplate] = useState(false);
  const [payments, setPayments] = useState<PaymentOverview | null>(null);
  const [planStatus, setPlanStatus] = useState<{
    plan: string;
    active: boolean;
    trialEndsAt: string | null;
    canUpgrade: boolean;
    canCheckout: boolean;
    hasCustomQuote: boolean;
    quoteLabel: string | null;
  } | null>(null);

  const buckets = useMemo(() => categorize(trips), [trips]);
  const recent = useMemo(
    () => [...buckets.active, ...buckets.upcoming].slice(0, 4),
    [buckets.active, buckets.upcoming]
  );

  const checklist = useMemo(
    () => [
      { href: "/agency/branding", label: "Configura logo y color de marca", done: hasBranding },
      { href: "/agency/clients", label: "Registra tus clientes", done: clientCount > 0 },
      { href: "/agency/team", label: "Invita a tu equipo por email", done: memberCount > 1 },
      { href: "/agency/templates", label: "Guarda una plantilla de viaje", done: templateCount > 0 },
      { href: "/agency/portals", label: "Publica el portal de un programa", done: publishedPortals > 0 },
      { href: "/agency", label: "Crea tu primer programa", done: trips.length > 0 },
      {
        href: "/agency/plan",
        label:
          planStatus?.quoteLabel && planStatus.canCheckout
            ? `Activa Agency Pro (${planStatus.quoteLabel}/mes)`
            : "Activa Agency Pro cuando tengas tarifa",
        done: planStatus?.plan === "agency_pro" || planStatus?.plan === "partnership",
      },
    ],
    [
      hasBranding,
      clientCount,
      memberCount,
      templateCount,
      publishedPortals,
      trips.length,
      planStatus?.plan,
      planStatus?.quoteLabel,
      planStatus?.canCheckout,
    ]
  );

  const checklistDone = checklist.filter((c) => c.done).length;
  const showChecklist = checklistDone < checklist.length;

  useEffect(() => {
    fetch("/api/agencies/payments/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json && !json.error) setPayments(json as PaymentOverview);
      })
      .catch(() => {});
    fetch("/api/agencies/billing/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.plan) {
          setPlanStatus({
            plan: json.plan,
            active: Boolean(json.active),
            trialEndsAt: json.trialEndsAt ?? null,
            canUpgrade: Boolean(json.canUpgrade),
            canCheckout: Boolean(json.canCheckout),
            hasCustomQuote: Boolean(json.hasCustomQuote),
            quoteLabel: json.quoteLabel ?? null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const pendingPayments = payments?.totals?.counts.pending ?? 0;
  const pendingAmount = payments?.totals?.pending ?? 0;
  const showPaymentsAlert = !payments?.needsMigration && (pendingPayments > 0 || pendingAmount > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Bienvenido, {userDisplayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {agencyName} · {buckets.active.length} en curso · {trips.length} programas en total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowFromTemplate(true);
              setShowCreate(false);
            }}
            className={`${agencyBtnSecondaryClass} gap-1.5 text-xs`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden />
            Desde plantilla
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setShowFromTemplate(false);
            }}
            className={showCreate ? agencyBtnSecondaryClass : agencyBtnPrimaryClass}
          >
            {showCreate ? "Cancelar" : "+ Nuevo viaje"}
          </button>
        </div>
      </div>

      {planStatus && !planStatus.active && planStatus.plan !== "partnership" ? (
        <div
          className={`${agencyCardClass} flex flex-wrap items-center justify-between gap-3 border-amber-300/80 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30`}
        >
          <p className="text-sm text-amber-950 dark:text-amber-100">
            <AlertTriangle className="mr-1.5 inline h-4 w-4 shrink-0" aria-hidden />
            Tu plan no está activo. El panel puede estar limitado hasta que actives Agency Pro.
          </p>
          <Link href="/agency/plan" className={`${agencyBtnSecondaryClass} text-xs`}>
            Ver plan y facturación
          </Link>
        </div>
      ) : null}

      {planStatus?.plan === "trial" && planStatus.active && planStatus.trialEndsAt ? (
        <div
          className={`${agencyCardClass} flex flex-wrap items-center justify-between gap-3 border-sky-200/80 bg-sky-50/60 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20`}
        >
          <p className="text-sm text-sky-950 dark:text-sky-100">
            Prueba gratuita hasta{" "}
            <strong>
              {new Date(planStatus.trialEndsAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
              })}
            </strong>
            {planStatus.hasCustomQuote && planStatus.quoteLabel ? (
              <>
                {" "}
                · Tarifa acordada: <strong>{planStatus.quoteLabel}/mes</strong>
              </>
            ) : null}
          </p>
          {planStatus.canUpgrade ? (
            <Link href="/agency/plan" className={`${agencyBtnSecondaryClass} text-xs`}>
              Pasar a Agency Pro
            </Link>
          ) : null}
        </div>
      ) : null}

      {planStatus?.plan === "trial" && planStatus.active && !planStatus.canCheckout ? (
        <div
          className={`${agencyCardClass} px-4 py-3 text-sm text-slate-600 dark:text-slate-300`}
        >
          Tu tarifa mensual se configura tras el acuerdo inicial con Kaviro. Cuando esté lista, podrás activar Agency
          Pro desde{" "}
          <Link href="/agency/plan" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            Plan y facturación
          </Link>{" "}
          o escríbenos en{" "}
          <a href={agencyPartnershipMailto()} className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            {AGENCY_PARTNERSHIP_EMAIL}
          </a>
          .
        </div>
      ) : null}

      {pendingInvites > 0 ? (
        <div
          className={`${agencyCardClass} flex flex-wrap items-center justify-between gap-3 border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30`}
        >
          <p className="text-sm text-amber-950 dark:text-amber-100">
            <UserPlus className="mr-1.5 inline h-4 w-4 shrink-0" aria-hidden />
            Tienes <strong>{pendingInvites}</strong> invitación{pendingInvites === 1 ? "" : "es"} de equipo pendiente
            {pendingInvites === 1 ? "" : "s"}.
          </p>
          <Link href="/agency/team" className={`${agencyBtnSecondaryClass} text-xs`}>
            Ver equipo
          </Link>
        </div>
      ) : null}

      {showPaymentsAlert ? (
        <div
          className={`${agencyCardClass} flex flex-wrap items-center justify-between gap-3 border-sky-200/80 bg-sky-50/60 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/20`}
        >
          <p className="text-sm text-sky-950 dark:text-sky-100">
            <CreditCard className="mr-1.5 inline h-4 w-4 shrink-0" aria-hidden />
            {pendingPayments > 0 ? (
              <>
                <strong>{pendingPayments}</strong> cobro{pendingPayments === 1 ? "" : "s"} pendiente
                {pendingPayments === 1 ? "" : "s"}
                {pendingAmount > 0 ? (
                  <>
                    {" "}
                    · <strong>{pendingAmount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</strong>{" "}
                    por recibir
                  </>
                ) : null}
              </>
            ) : (
              <>Hay importes pendientes de cobro en tus programas.</>
            )}
          </p>
          <Link href="/agency/finance" className={`${agencyBtnSecondaryClass} text-xs`}>
            Ver cobros
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "En curso", value: buckets.active.length, accent: "text-[#1e3a5f] dark:text-sky-300" },
          { label: "Próximos", value: upcomingCount, accent: "" },
          { label: "Clientes", value: clientCount, accent: "" },
          { label: "Portales activos", value: publishedPortals, accent: "text-violet-700 dark:text-violet-300" },
          { label: "Vistas portal (30 d)", value: portalViews30d, accent: "text-emerald-600 dark:text-emerald-400" },
          { label: "Equipo", value: `${memberCount}/${maxMembers}`, accent: "" },
        ].map((m) => (
          <div key={m.label} className={`${agencyCardClass} p-4 text-center`}>
            <p className={`text-2xl font-semibold tabular-nums text-slate-900 dark:text-white ${m.accent}`}>
              {m.value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
          </div>
        ))}
      </div>

      {showCreate ? (
        <AgencyCreateTripForm agencySlug={agencySlug} onCreated={() => setShowCreate(false)} />
      ) : null}

      <AgencyInstantiateFromTemplateModal
        open={showFromTemplate}
        onClose={() => setShowFromTemplate(false)}
      />

      {showChecklist ? (
        <section className={`${agencyCardClass} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Primeros pasos</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {checklistDone}/{checklist.length} completados
              </p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#1e3a5f] transition-all dark:bg-sky-600"
                style={{ width: `${Math.round((checklistDone / checklist.length) * 100)}%` }}
              />
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 text-sm transition hover:opacity-80 ${
                    item.done
                      ? "text-slate-500 line-through decoration-slate-400/70"
                      : "font-medium text-[#1e3a5f] dark:text-sky-300"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                  )}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${agencyCardClass} block p-4 transition hover:border-[#1e3a5f]/40 dark:hover:border-sky-700/50`}
          >
            <p className="font-semibold text-slate-900 dark:text-white">{card.title}</p>
            <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Próximos programas
          </h2>
          <Link
            href="/agency/trips"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className={`${agencyCardClass} px-4 py-10 text-center text-sm text-slate-600`}>
            Crea tu primer programa con «Nuevo viaje» o duplica una plantilla.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((trip) => (
              <AgencyTripRowItem key={trip.id} trip={trip} agencySlug={agencySlug} />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Plan y número de perfiles acordados con Kaviro. Para ampliar equipo o funciones:{" "}
        <a href={`mailto:${AGENCY_PARTNERSHIP_EMAIL}`} className="font-semibold text-[#1e3a5f] dark:text-sky-300">
          {AGENCY_PARTNERSHIP_EMAIL}
        </a>
      </p>
    </div>
  );
}
