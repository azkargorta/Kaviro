"use client";

import { useMemo } from "react";
import {
  PAYMENT_OVERALL_COLORS,
  PAYMENT_OVERALL_LABELS,
  formatMoney,
  type ParticipantPaymentSummary,
} from "@/lib/agency/payments";

type StatusCounts = {
  pending: number;
  deposit_paid: number;
  paid: number;
  cancelled: number;
};

type TravelerChartRow = {
  name: string;
  collected: number;
  pending: number;
  overall: string;
};

type Props = {
  statusCounts: StatusCounts;
  travelers: TravelerChartRow[];
  currency: string;
};

const STATUS_COLORS: Record<keyof StatusCounts, string> = {
  pending: "#f59e0b",
  deposit_paid: "#0ea5e9",
  paid: "#10b981",
  cancelled: "#94a3b8",
};

function Donut({ segments, total }: { segments: Array<{ label: string; value: number; color: string }>; total: number }) {
  const R = 64;
  const CX = 80;
  const CY = 80;
  const STROKE = 20;
  let cum = -Math.PI / 2;

  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const sweep = total > 0 ? (seg.value / total) * 2 * Math.PI : 0;
      const start = cum;
      const end = cum + sweep;
      cum = end;
      const x1 = CX + R * Math.cos(start);
      const y1 = CY + R * Math.sin(start);
      const x2 = CX + R * Math.cos(end);
      const y2 = CY + R * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      if (sweep <= 0) return null;
      return (
        <path
          key={seg.label}
          d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
          fill="none"
          stroke={seg.color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
      );
    });

  return (
    <svg viewBox="0 0 160 160" className="h-36 w-36">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
      {arcs}
      <text x={CX} y={CY - 4} textAnchor="middle" className="fill-slate-900 text-[15px] font-extrabold">
        {total}
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle" className="fill-slate-500 text-[9px] font-semibold">
        viajeros
      </text>
    </svg>
  );
}

export default function AgencyPaymentCharts({ statusCounts, travelers, currency }: Props) {
  const statusSegments = useMemo(() => {
    return (Object.keys(statusCounts) as Array<keyof StatusCounts>)
      .map((key) => ({
        key,
        label: PAYMENT_OVERALL_LABELS[key as ParticipantPaymentSummary["overall"]],
        value: statusCounts[key],
        color: STATUS_COLORS[key],
      }))
      .filter((s) => s.value > 0);
  }, [statusCounts]);

  const totalTravelers = statusSegments.reduce((a, b) => a + b.value, 0);
  const maxBar = Math.max(...travelers.map((t) => t.collected + t.pending), 1);

  if (!totalTravelers && !travelers.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Asigna precios y registra cobros para ver gráficos.
      </p>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F1623]">
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">Estado de cobros</p>
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Donut segments={statusSegments} total={totalTravelers} />
          <ul className="min-w-0 flex-1 space-y-2">
            {statusSegments.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
                <span className="font-bold text-slate-900 dark:text-white">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F1623]">
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">Cobrado vs pendiente por viajero</p>
        <ul className="mt-4 space-y-3">
          {travelers.map((t) => {
            const total = t.collected + t.pending;
            const collectedPct = total > 0 ? (t.collected / maxBar) * 100 : 0;
            const pendingPct = total > 0 ? (t.pending / maxBar) * 100 : 0;
            return (
              <li key={t.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${PAYMENT_OVERALL_COLORS[t.overall as keyof typeof PAYMENT_OVERALL_COLORS] ?? "bg-slate-100"}`}
                  >
                    {PAYMENT_OVERALL_LABELS[t.overall as keyof typeof PAYMENT_OVERALL_LABELS] ?? t.overall}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {t.collected > 0 ? (
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${collectedPct}%` }}
                      title={`Cobrado: ${formatMoney(t.collected, currency)}`}
                    />
                  ) : null}
                  {t.pending > 0 ? (
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${pendingPct}%` }}
                      title={`Pendiente: ${formatMoney(t.pending, currency)}`}
                    />
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {formatMoney(t.collected, currency)} cobrado · {formatMoney(t.pending, currency)} pendiente
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
