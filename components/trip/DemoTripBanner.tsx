"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

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
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-4 py-3 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:via-[#0F1623] dark:to-cyan-950/20">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-800 dark:text-violet-300">
        Viaje de práctica
      </p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
        Explora Londres de ejemplo con plan, gastos en GBP/EUR/USD y balances. Al terminar el recorrido volverás al panel.
        Puedes <strong>saltar la demo</strong> cuando quieras.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
