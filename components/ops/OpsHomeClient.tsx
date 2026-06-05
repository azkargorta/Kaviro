"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function OpsHomeClient() {
  const [counts, setCounts] = useState<{ agencies: number; leadsNew: number; tripsB2b: number } | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ops/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.needsMigration) {
          setNeedsMigration(true);
          return;
        }
        if (data.error) throw new Error(data.error);
        setCounts(data.counts);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (needsMigration) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Ejecuta <code>docs/kaviro_platform_ops.sql</code> en Supabase para activar leads y notas CRM.
      </p>
    );
  }

  if (!counts) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Vista global de agencias B2B y solicitudes de acceso.{" "}
        <Link href="/ops/migrations" className="font-semibold text-amber-800 underline dark:text-amber-300">
          Comprobar migraciones SQL →
        </Link>
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/ops/agencies"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agencias</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{counts.agencies}</p>
        </Link>
        <Link
          href="/ops/leads"
          className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Leads nuevos
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-950 dark:text-amber-100">{counts.leadsNew}</p>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Viajes B2B</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{counts.tripsB2b}</p>
        </div>
      </div>
    </div>
  );
}
