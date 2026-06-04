export type AgencyTripCalendarStatus = "preparation" | "active" | "completed" | "unscheduled";

export type AgencyTripCalendarItem = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  clientName: string | null;
  status: AgencyTripCalendarStatus;
  operationsHref: string;
  planHref: string;
};

export function classifyTripCalendarStatus(
  start: string | null,
  end: string | null,
  today = new Date().toISOString().slice(0, 10)
): AgencyTripCalendarStatus {
  if (!start && !end) return "unscheduled";
  if (start && end && start <= today && today <= end) return "active";
  if (start && start > today) return "preparation";
  if (end && end < today) return "completed";
  if (start && start <= today) return "active";
  return "preparation";
}

export const CALENDAR_STATUS_LABELS: Record<AgencyTripCalendarStatus, string> = {
  preparation: "Preparación",
  active: "En curso",
  completed: "Finalizado",
  unscheduled: "Sin fechas",
};

export const CALENDAR_STATUS_COLORS: Record<AgencyTripCalendarStatus, string> = {
  preparation: "bg-amber-500",
  active: "bg-emerald-500",
  completed: "bg-slate-400",
  unscheduled: "bg-violet-400",
};

/** Viajes que solapan un mes YYYY-MM */
export function tripOverlapsMonth(
  start: string | null,
  end: string | null,
  year: number,
  month: number
): boolean {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  if (!start && !end) return false;
  const s = start ?? end ?? monthStart;
  const e = end ?? start ?? monthEnd;
  return s <= monthEnd && e >= monthStart;
}

export function buildIcsCalendar(trips: AgencyTripCalendarItem[], agencyName: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kaviro Trips//ES",
    `X-WR-CALNAME:${escapeIcs(agencyName)}`,
  ];

  for (const t of trips) {
    if (!t.start_date) continue;
    const dtStart = t.start_date.replace(/-/g, "");
    const dtEnd = (t.end_date ?? t.start_date).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@kaviro.app`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeIcs(t.name)}`,
      t.destination ? `LOCATION:${escapeIcs(t.destination)}` : "",
      `URL:${escapeIcs(`https://www.kaviro.app${t.operationsHref}`)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
