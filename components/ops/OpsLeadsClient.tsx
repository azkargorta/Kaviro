"use client";

import { useCallback, useEffect, useState } from "react";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/platform-ops/leads";
import { Loader2 } from "lucide-react";

type Lead = {
  id: string;
  contact_name: string;
  agency_name: string;
  email: string;
  groups_per_year: string | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
};

export default function OpsLeadsClient() {
  const [filter, setFilter] = useState("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/leads?status=${filter}`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setLeads(data.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: LeadStatus) {
    const res = await fetch(`/api/ops/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    await load();
  }

  if (needsMigration) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Ejecuta <code>docs/kaviro_platform_ops.sql</code> en Supabase.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "new", "contacted", "qualified", "converted", "rejected"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {s === "all" ? "Todos" : LEAD_STATUS_LABELS[s as LeadStatus]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{l.agency_name}</p>
                  <p className="text-sm text-slate-600">
                    {l.contact_name} ·{" "}
                    <a href={`mailto:${l.email}`} className="underline">
                      {l.email}
                    </a>
                  </p>
                  {l.groups_per_year ? (
                    <p className="text-xs text-slate-500">Grupos/año: {l.groups_per_year}</p>
                  ) : null}
                  {l.message ? <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{l.message}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(l.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
                <select
                  value={l.status}
                  onChange={(e) => void setStatus(l.id, e.target.value as LeadStatus)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
          {leads.length === 0 ? <p className="text-center text-slate-500">Sin leads en este filtro.</p> : null}
        </ul>
      )}
    </div>
  );
}
