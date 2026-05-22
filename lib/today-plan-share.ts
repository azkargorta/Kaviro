import type { TripActivity } from "@/hooks/useTripActivities";

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function formatTime(t: string | null | undefined) {
  if (!t) return "";
  const clean = t.trim();
  if (/^\d{2}:\d{2}/.test(clean)) return clean.slice(0, 5);
  return clean;
}

function formatDayLabel(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function buildTodayPlanWhatsAppText(opts: {
  tripName: string;
  destination?: string | null;
  activities: TripActivity[];
  dateKey?: string;
}): string {
  const dateKey = opts.dateKey || todayYMD();
  const dayActivities = opts.activities
    .filter((a) => (a.activity_date || "") === dateKey)
    .sort((a, b) => String(a.activity_time || "").localeCompare(String(b.activity_time || "")));

  const lines: string[] = [];
  lines.push(`📅 Plan de hoy — ${opts.tripName}`);
  if (opts.destination?.trim()) lines.push(`📍 ${opts.destination.trim()}`);
  lines.push(formatDayLabel(dateKey));
  lines.push("");

  if (!dayActivities.length) {
    lines.push("Sin actividades programadas para hoy.");
  } else {
    for (const a of dayActivities) {
      const time = formatTime(a.activity_time);
      const place = [a.place_name, a.address].filter(Boolean).join(" · ");
      lines.push(`${time ? `${time} — ` : ""}${a.title}`);
      if (place) lines.push(`   ${place}`);
      if (a.description?.trim()) lines.push(`   ${a.description.trim()}`);
    }
  }

  lines.push("");
  lines.push("— Compartido desde Kaviro");
  return lines.join("\n");
}

export function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
