"use client";

import { useEffect, useMemo, useState } from "react";
import { SQL_MIGRATION_GROUP_LABELS } from "@/lib/sql-migration-catalog";
import type { SqlMigrationHealthRow } from "@/lib/server/sql-migration-health";
import { AlertTriangle, CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";

type Report = {
  rows: SqlMigrationHealthRow[];
  summary: { ok: number; missing: number; error: number; missingRequired: number };
};

export default function OpsSqlMigrationsClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ops/sql-migrations", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReport(data as Report);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  const grouped = useMemo(() => {
    if (!report) return [];
    const map = new Map<string, SqlMigrationHealthRow[]>();
    for (const row of report.rows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [report]);

  async function copyPath(file: string) {
    const path = `docs/${file}`;
    try {
      await navigator.clipboard.writeText(path);
      setCopied(file);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* */
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!report) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Comprueba qué scripts de <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">docs/*.sql</code> faltan
        en Supabase producción. Ejecuta los marcados como pendientes en el SQL Editor, en orden.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="OK" value={report.summary.ok} tone="ok" />
        <Stat label="Pendientes" value={report.summary.missing} tone="warn" />
        <Stat label="Requeridos pendientes" value={report.summary.missingRequired} tone="bad" />
        <Stat label="Errores de lectura" value={report.summary.error} tone="neutral" />
      </div>

      {report.summary.missingRequired > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="mr-1.5 inline h-4 w-4" aria-hidden />
          Hay {report.summary.missingRequired} migración{report.summary.missingRequired === 1 ? "" : "es"} obligatoria
          {report.summary.missingRequired === 1 ? "" : "s"} sin aplicar. Algunas funciones fallarán hasta ejecutarlas.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden />
          Todas las migraciones obligatorias del catálogo están presentes.
        </div>
      )}

      {grouped.map(([group, rows]) => (
        <section key={group} className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-white">
            {SQL_MIGRATION_GROUP_LABELS[group as keyof typeof SQL_MIGRATION_GROUP_LABELS] ?? group}
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {row.label}
                    {row.optional ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">opcional</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">docs/{row.file}</p>
                  {row.detail && row.status !== "ok" ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{row.detail}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={row.status} />
                  <button
                    type="button"
                    onClick={() => void copyPath(row.file)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    title="Copiar ruta del script"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {copied === row.file ? "Copiado" : "Ruta"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-slate-500">
        También puedes ejecutar <code>docs/SQL_PRODUCCION_VERIFICACION.sql</code> directamente en Supabase para un
        informe en SQL puro.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "bad" | "neutral";
}) {
  const colors = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30",
    warn: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30",
    bad: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30",
    neutral: "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SqlMigrationHealthRow["status"] }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        OK
      </span>
    );
  }
  if (status === "missing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
      <XCircle className="h-3.5 w-3.5" aria-hidden />
      Error
    </span>
  );
}
