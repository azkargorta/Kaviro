"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { agencyBtnPrimaryClass, agencyCardClass, KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

export default function AgencyJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error" | "login">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enlace de invitación no válido.");
      return;
    }

    let cancelled = false;

    async function run() {
      setStatus("loading");
      const res = await fetch("/api/agencies/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));

      if (cancelled) return;

      if (res.status === 401) {
        setStatus("login");
        setMessage("Inicia sesión con el email de la invitación para unirte al equipo.");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "No se pudo aceptar la invitación.");
        return;
      }

      setStatus("ok");
      setTimeout(() => router.replace("/agency"), 1200);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const loginHref = `/auth/login?mode=agency&next=${encodeURIComponent(`/agency/join?token=${token}`)}`;

  return (
    <div
      className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4 dark:bg-[#060a12]`}
    >
      <div className={`${agencyCardClass} w-full max-w-md p-6 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{KAVIRO_TRIPS_PRODUCT_NAME}</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Unirse al equipo</h1>

        {status === "loading" ? <p className="mt-4 text-sm text-slate-600">Procesando invitación…</p> : null}
        {status === "ok" ? (
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">¡Listo! Redirigiendo al panel…</p>
        ) : null}
        {message ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}

        {status === "login" ? (
          <Link href={loginHref} className={`${agencyBtnPrimaryClass} mt-6 inline-flex`}>
            Iniciar sesión
          </Link>
        ) : null}

        {status === "error" ? (
          <Link href="/empresa" className={`${agencyBtnPrimaryClass} mt-6 inline-flex`}>
            Volver a {KAVIRO_TRIPS_PRODUCT_NAME}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
