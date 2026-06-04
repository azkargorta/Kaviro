"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  CALENDAR_STATUS_COLORS,
  CALENDAR_STATUS_LABELS,
  type AgencyTripCalendarItem,
  type AgencyTripCalendarStatus,
} from "@/lib/agency/calendar";
import { agencyBtnSecondaryClass, agencyCardClass } from "@/lib/agency-theme";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Lunes = 0 … Domingo = 6 */
function mondayBasedWeekday(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 ? 6 : d - 1;
}

function tripOnDay(trip: AgencyTripCalendarItem, iso: string) {
  const s = trip.start_date;
  const e = trip.end_date ?? trip.start_date;
  if (!s) return false;
  return s <= iso && (e ?? s) >= iso;
}

export default function AgencyOperationsCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [trips, setTrips] = useState<AgencyTripCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/calendar?year=${year}&month=${month}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setTrips(data.trips ?? []);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
        new Date(year, month - 1, 1)
      ),
    [year, month]
  );

  const grid = useMemo(() => {
    const total = daysInMonth(year, month);
    const offset = mondayBasedWeekday(year, month, 1);
    const cells: Array<{ day: number | null; iso: string | null }> = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, iso: null });
    for (let d = 1; d <= total; d++) {
      cells.push({ day: d, iso: `${year}-${pad(month)}-${pad(d)}` });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });
    return cells;
  }, [year, month]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const statusCounts = trips.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<AgencyTripCalendarStatus, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[10rem] text-center text-lg font-semibold capitalize text-slate-900 dark:text-white">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <a href="/api/agencies/calendar/export" className={`${agencyBtnSecondaryClass} gap-1.5 text-xs`}>
          <Download className="h-3.5 w-3.5" aria-hidden />
          Exportar .ics
        </a>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(CALENDAR_STATUS_LABELS) as AgencyTripCalendarStatus[]).map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full ${CALENDAR_STATUS_COLORS[key]}`} aria-hidden />
            {CALENDAR_STATUS_LABELS[key]}
            {statusCounts[key] ? ` (${statusCounts[key]})` : ""}
          </span>
        ))}
      </div>

      <div className={`${agencyCardClass} overflow-hidden p-0`}>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((cell, idx) => {
            const dayTrips = cell.iso ? trips.filter((t) => tripOnDay(t, cell.iso!)) : [];
            return (
              <div
                key={idx}
                className="min-h-[5.5rem] border-b border-r border-slate-100 p-1.5 dark:border-slate-800"
              >
                {cell.day ? (
                  <>
                    <span className="text-[10px] font-semibold text-slate-500">{cell.day}</span>
                    <ul className="mt-1 space-y-0.5">
                      {dayTrips.slice(0, 3).map((t) => (
                        <li key={t.id}>
                          <Link
                            href={t.operationsHref}
                            className={`block truncate rounded px-1 py-0.5 text-[9px] font-semibold text-white ${CALENDAR_STATUS_COLORS[t.status]}`}
                            title={t.name}
                          >
                            {t.name}
                          </Link>
                        </li>
                      ))}
                      {dayTrips.length > 3 ? (
                        <li className="text-[9px] text-slate-400">+{dayTrips.length - 3}</li>
                      ) : null}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-slate-500">No hay viajes con fechas en este mes.</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Programas del mes</h3>
          {trips.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {t.start_date ?? "—"} → {t.end_date ?? "—"} · {CALENDAR_STATUS_LABELS[t.status]}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={t.operationsHref} className="text-xs font-semibold text-[#1e3a5f] underline dark:text-sky-300">
                  Operaciones
                </Link>
                <Link href={t.planHref} className="text-xs font-semibold text-slate-500 underline">
                  Plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
