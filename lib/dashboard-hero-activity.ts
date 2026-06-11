import type { DashboardContinueNextActivity } from "@/components/dashboard/DashboardContinueTrip";

type ActivityRow = {
  title: string | null;
  activity_time: string | null;
  activity_date: string | null;
};

export function pickNextActivityFromRows(
  rows: ActivityRow[],
  today: string,
  nowHHMM: string
): DashboardContinueNextActivity | null {
  const sorted = [...rows].sort((a, b) => {
    const da = a.activity_date || "9999-99-99";
    const db = b.activity_date || "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    const ta = (a.activity_time || "").slice(0, 5);
    const tb = (b.activity_time || "").slice(0, 5);
    return ta.localeCompare(tb);
  });

  for (const row of sorted) {
    const date = (row.activity_date || "").trim();
    if (!date || date < today) continue;

    const time = row.activity_time?.trim().slice(0, 5) || null;
    const title = (row.title || "").trim() || "Actividad";

    if (date > today) {
      const dateLabel = new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${date}T12:00:00`));
      return { title, time, dateLabel };
    }

    if (!time || time >= nowHHMM) {
      return { title, time, dateLabel: null };
    }
  }

  return null;
}
