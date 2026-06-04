"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Row = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tripCount: number;
  memberCount: number;
  ownerLabel: string;
};

export default function OpsAgenciesClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ops/agencies", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!r.ok) throw new Error(data.error);
        setRows(data.agencies ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Agencia</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Viajes</th>
            <th className="px-4 py-3">Equipo</th>
            <th className="px-4 py-3">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-3">
                <Link href={`/ops/agencies/${a.id}`} className="font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300">
                  {a.name}
                </Link>
                <p className="text-xs text-slate-500">{a.slug}</p>
              </td>
              <td className="px-4 py-3">{a.plan}</td>
              <td className="px-4 py-3">{a.tripCount}</td>
              <td className="px-4 py-3">{a.memberCount}</td>
              <td className="px-4 py-3 text-slate-600">{a.ownerLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="p-6 text-center text-slate-500">Sin agencias.</p> : null}
    </div>
  );
}
