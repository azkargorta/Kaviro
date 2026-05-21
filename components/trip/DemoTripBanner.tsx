"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

async function postDemoAction(action: "skip" | "complete") {
  const res = await fetch("/api/onboarding/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
    credentials: "include",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || "No se pudo guardar.");
  return payload as { redirectTo?: string };
}

export default function DemoTripBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const tripId = pathname?.match(/^\/trip\/([^/]+)/)?.[1];
  const tourHref = tripId ? `/trip/${tripId}/summary?tutorial=demo` : null;

  async function skipDemo() {
    try {
      setLoading(true);
      const payload = await postDemoAction("skip");
      router.push(payload.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-gradient-to-r from-[var(--brand-light)] via-white to-slate-50 px-4 py-3 shadow-sm dark:border-[#F87171]/20 dark:from-[#F87171]/10 dark:via-[#0F1623] dark:to-[#0F1623]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-text)] dark:text-[#FCA5A5]">
        Viaje de práctica
      </p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
        Explora Londres de ejemplo con plan, gastos en GBP/EUR/USD y balances. Al terminar el recorrido volverás al panel.
        Puedes <strong>saltar la demo</strong> cuando quieras.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {tourHref ? (
          <Link
            href={tourHref}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#F87171] px-4 text-xs font-bold text-white transition hover:bg-[#EF4444]"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Iniciar visita guiada
          </Link>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={skipDemo}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          {loading ? "Guardando…" : "Saltar demo e ir al panel"}
        </button>
      </div>
    </div>
  );
}
