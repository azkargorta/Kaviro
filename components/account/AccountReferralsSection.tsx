"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Copy, Check } from "lucide-react";

type ReferralStatus = {
  referralCode: string | null;
  monthsEarned: number;
  referralsCount: number;
  wasReferred: boolean;
  inviteUrl: string | null;
};

export default function AccountReferralsSection() {
  const [data, setData] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referral/status", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("No se pudo cargar referidos."))))
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const copyInvite = useCallback(() => {
    if (!data?.inviteUrl) return;
    navigator.clipboard.writeText(data.inviteUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.inviteUrl]);

  return (
    <section className="card-soft p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F87171]/10 text-[#F87171]">
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Referidos</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Invita amigos, gana Premium</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Por cada amigo que se registre con tu enlace, tú y él recibís 1 mes de Premium gratis.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-amber-800">{error}</p>
      ) : !data?.inviteUrl ? (
        <p className="text-sm text-slate-600">
          Tu código de referido se generará en breve. Si el problema persiste, contacta con soporte.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#334155] dark:bg-[#0F1623]">
              <p className="text-xs font-semibold text-slate-500">Amigos invitados</p>
              <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{data.referralsCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#334155] dark:bg-[#0F1623]">
              <p className="text-xs font-semibold text-slate-500">Meses Premium ganados</p>
              <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{data.monthsEarned}</p>
            </div>
          </div>
          {data.wasReferred ? (
            <p className="text-xs text-slate-500">Te registraste con el enlace de un amigo. ¡Gracias por unirte!</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300">
              {data.inviteUrl}
            </code>
            <button
              type="button"
              onClick={copyInvite}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
