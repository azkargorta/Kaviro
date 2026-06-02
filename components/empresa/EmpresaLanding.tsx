import Link from "next/link";
import KaviroLogo from "@/components/brand/KaviroLogo";
import {
  AGENCY_PARTNERSHIP_EMAIL,
  APP_NAME,
  agencyPartnershipMailto,
  KAVIRO_TRIPS_PRODUCT_NAME,
  KAVIRO_TRIPS_TAGLINE,
} from "@/lib/brand";
import { Briefcase, CheckCircle2, Mail } from "lucide-react";

type Props = {
  hasAgency: boolean;
  isLoggedIn: boolean;
  reason?: string;
};

export default function EmpresaLanding({ hasAgency, isLoggedIn, reason }: Props) {
  const loginHref = "/auth/login?mode=agency&next=/agency";
  const mailto = agencyPartnershipMailto();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2744] via-[#1e3a5f] to-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-safe-inline py-12 sm:px-6 sm:py-16">
        <KaviroLogo variant="light" size="md" withWordmark />

        {reason === "no-membership" && isLoggedIn ? (
          <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Tu cuenta aún no tiene acceso a {KAVIRO_TRIPS_PRODUCT_NAME}. Escríbenos a{" "}
            <a href={mailto} className="font-semibold underline">
              {AGENCY_PARTNERSHIP_EMAIL}
            </a>{" "}
            y te activamos el acceso.
          </div>
        ) : null}

        <h1 className="mt-8 text-3xl font-black leading-tight sm:text-4xl">{KAVIRO_TRIPS_PRODUCT_NAME}</h1>
        <p className="mt-4 text-lg text-slate-200">{KAVIRO_TRIPS_TAGLINE}.</p>
        <p className="mt-2 text-sm text-slate-300">
          Panel para agencias y organizadores. Tus clientes ven el programa en un enlace con tu marca, aparte del
          modo personal de {APP_NAME}.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-slate-100">
          {[
            "Panel centralizado con todos los grupos",
            "Equipo con roles (admin / editor)",
            "Plantillas reutilizables entre clientes",
            "Portal cliente con tu logo y colores",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              {line}
            </li>
          ))}
        </ul>

        {!hasAgency ? (
          <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" aria-hidden />
              <div>
                <p className="font-bold text-white">¿Quieres usar {KAVIRO_TRIPS_PRODUCT_NAME}?</p>
                <p className="mt-2 text-sm text-slate-200">
                  Es para agencias y organizadores con acuerdo previo. Cuéntanos tu caso y te explicamos planes,
                  onboarding y precios.
                </p>
                <a
                  href={mailto}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {AGENCY_PARTNERSHIP_EMAIL}
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {hasAgency ? (
            <Link
              href="/agency"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
            >
              <Briefcase className="h-4 w-4" aria-hidden />
              Abrir {KAVIRO_TRIPS_PRODUCT_NAME}
            </Link>
          ) : (
            <a
              href={mailto}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Contactar con Kaviro
            </a>
          )}

          {hasAgency || isLoggedIn ? (
            <Link
              href={hasAgency ? "/agency" : loginHref}
              className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {hasAgency ? KAVIRO_TRIPS_PRODUCT_NAME : "Ya tengo acceso — iniciar sesión"}
            </Link>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ya tengo acceso — iniciar sesión
            </Link>
          )}

          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            className="inline-flex min-h-11 items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            {isLoggedIn ? "Volver al inicio (modo personal)" : "Soy viajero"}
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          {KAVIRO_TRIPS_PRODUCT_NAME}: <strong className="text-slate-200">kaviro.app/empresa</strong> · Panel:{" "}
          <strong className="text-slate-200">kaviro.app/agency</strong> (solo cuentas autorizadas)
        </p>
      </div>
    </div>
  );
}
