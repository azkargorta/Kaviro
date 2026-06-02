import Link from "next/link";
import KaviroLogo from "@/components/brand/KaviroLogo";
import {
  AGENCY_PARTNERSHIP_EMAIL,
  APP_NAME,
  agencyPartnershipMailto,
  KAVIRO_TRIPS_PRODUCT_NAME,
  KAVIRO_TRIPS_TAGLINE,
} from "@/lib/brand";
import { Mail } from "lucide-react";

type Props = {
  hasAgency: boolean;
  isLoggedIn: boolean;
  reason?: string;
};

export default function EmpresaLanding({ hasAgency, isLoggedIn, reason }: Props) {
  const loginHref = "/auth/login?mode=agency&next=/agency";
  const mailto = agencyPartnershipMailto();

  return (
    <div className="min-h-screen bg-[#0f2744] text-white">
      <div className="border-b border-white/10 bg-[#1e3a5f]">
        <div className="mx-auto max-w-3xl px-safe-inline py-4 sm:px-6">
          <KaviroLogo variant="light" size="md" withWordmark />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-safe-inline py-12 sm:px-6 sm:py-16">
        {reason === "no-membership" && isLoggedIn ? (
          <div className="rounded-md border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Tu cuenta aún no tiene acceso a {KAVIRO_TRIPS_PRODUCT_NAME}. Escríbenos a{" "}
            <a href={mailto} className="font-semibold underline">
              {AGENCY_PARTNERSHIP_EMAIL}
            </a>
            .
          </div>
        ) : null}

        <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{KAVIRO_TRIPS_PRODUCT_NAME}</h1>
        <p className="mt-3 text-lg text-slate-200">{KAVIRO_TRIPS_TAGLINE}.</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
          Herramienta profesional para agencias y DMC. Tus clientes consultan el programa en un portal con tu marca;
          tu equipo opera en un panel separado de {APP_NAME} personal.
        </p>

        <ul className="mt-10 space-y-3 border-t border-white/10 pt-8 text-sm text-slate-200">
          {[
            "Panel centralizado de programas y grupos",
            "Roles de equipo: administración y edición",
            "Plantillas operativas entre temporadas",
            "Portal cliente corporativo (logo y color de marca)",
          ].map((line) => (
            <li key={line} className="border-l-2 border-white/25 pl-4">
              {line}
            </li>
          ))}
        </ul>

        {!hasAgency ? (
          <div className="mt-10 rounded-md border border-white/15 bg-white/5 p-5">
            <p className="font-semibold text-white">Solicitar acceso</p>
            <p className="mt-2 text-sm text-slate-300">
              {KAVIRO_TRIPS_PRODUCT_NAME} se activa bajo acuerdo comercial. Indícanos volumen de grupos y tipo de
              viajes.
            </p>
            <a
              href={mailto}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-100"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {AGENCY_PARTNERSHIP_EMAIL}
            </a>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {hasAgency ? (
            <Link
              href="/agency"
              className="inline-flex min-h-10 items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-100"
            >
              Acceder al panel
            </Link>
          ) : (
            <a
              href={mailto}
              className="inline-flex min-h-10 items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-100"
            >
              Contactar
            </a>
          )}

          <Link
            href={hasAgency ? "/agency" : loginHref}
            className="inline-flex min-h-10 items-center rounded-md border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
          >
            {hasAgency ? "Panel" : "Iniciar sesión (cuenta autorizada)"}
          </Link>

          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            className="inline-flex min-h-10 items-center px-3 py-2.5 text-sm text-slate-400 transition hover:text-white"
          >
            {isLoggedIn ? `${APP_NAME} personal` : `Soy usuario de ${APP_NAME}`}
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          {KAVIRO_TRIPS_PRODUCT_NAME} · kaviro.app/empresa · Panel: kaviro.app/agency
        </p>
      </div>
    </div>
  );
}
