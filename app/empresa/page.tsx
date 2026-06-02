import Link from "next/link";
import KaviroLogo from "@/components/brand/KaviroLogo";
import { Briefcase, CheckCircle2 } from "lucide-react";

type Props = {
  searchParams?: { reason?: string };
};

export default function EmpresaLandingPage({ searchParams }: Props) {
  const reason = searchParams?.reason;
  const loginHref = "/auth/login?mode=agency&next=/agency";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2744] via-[#1e3a5f] to-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-safe-inline py-12 sm:px-6 sm:py-16">
        <KaviroLogo variant="light" size="md" withWordmark />

        {reason === "no-membership" ? (
          <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Tu cuenta no está vinculada a ninguna agencia. Pide acceso al administrador o contacta con Kaviro.
          </div>
        ) : null}

        <h1 className="mt-8 text-3xl font-black leading-tight sm:text-4xl">
          Kaviro para agencias y organizadores
        </h1>
        <p className="mt-4 text-lg text-slate-200">
          Gestiona todos los viajes de tus clientes en un panel con tu marca. Los viajeros ven el programa en un
          enlace público, sin mezclarse con el modo personal de Kaviro.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-slate-100">
          {[
            "Panel centralizado con todos los grupos",
            "Equipo con roles (admin / editor)",
            "Importación de dossier con IA",
            "Portal cliente con tu logo y colores",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={loginHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100"
          >
            <Briefcase className="h-4 w-4" aria-hidden />
            Entrar al panel de agencia
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Soy viajero (modo personal)
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          URL del espacio empresa: <strong className="text-slate-200">kaviro.app/empresa</strong> → acceso →{" "}
          <strong className="text-slate-200">kaviro.app/agency</strong>
        </p>
      </div>
    </div>
  );
}
