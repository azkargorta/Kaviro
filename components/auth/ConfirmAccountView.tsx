"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function Card({
  tone,
  title,
  description,
}: {
  tone: "ok" | "error" | "info";
  title: string;
  description: string;
}) {
  const styles =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm opacity-90">{description}</div>
    </div>
  );
}

export default function ConfirmAccountView() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toLowerCase();
  const nextRaw = searchParams.get("next") || "/dashboard";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";
  const rawMessage = useMemo(
    () => searchParams.get("message") || "No se pudo validar el enlace.",
    [searchParams]
  );

  if (status === "ok") {
    return (
      <div className="space-y-5">
        <Card tone="ok" title="Cuenta confirmada" description="Tu email se ha validado correctamente." />
        <Link
          href={next}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[#F87171] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#EF4444]"
        >
          Continuar a Kaviro
        </Link>
      </div>
    );
  }

  if (status === "error") {
    const expired = /expired|caduc|token.*invalid|otp.*expired/i.test(rawMessage);
    const description = expired
      ? "El enlace ha caducado o ya fue utilizado. Vuelve al login con tu email y solicita un nuevo correo de confirmación."
      : "No hemos podido validar este enlace. Vuelve al login con tu email; si la cuenta sigue pendiente, podrás reenviar el correo de confirmación desde allí.";

    return (
      <div className="space-y-5">
        <Card tone="error" title="No se pudo confirmar la cuenta" description={description} />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300">
          Si abriste el enlace dentro de la vista previa de una app de correo, prueba a abrirlo directamente en Chrome, Safari o tu navegador habitual.
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#F87171] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#EF4444]"
          >
            Ir al login
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
          >
            Volver al registro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card tone="info" title="Abriendo enlace…" description="Si esta pantalla no cambia, vuelve a abrir el enlace desde tu correo." />
      <Link
        href="/auth/login"
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
      >
        Ir al login
      </Link>
    </div>
  );
}
