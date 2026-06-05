import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function formatICSDate(date: string, time?: string | null): string {
  const d = date.replace(/-/g, "");
  if (!time) return `${d}`;
  const t = time.replace(/:/g, "").slice(0, 6).padEnd(6, "0");
  return `${d}T${t}`;
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // ICS lines max 75 chars, fold with CRLF + space
  if (line.length <= 75) return line;
  let result = "";
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, 75);
      pos = 75;
    } else {
      result += "\r\n " + line.slice(pos, pos + 74);
      pos += 74;
    }
  }
  return result;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Verify access
    const { data: participant } = await supabase
      .from("trip_participants")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!participant) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    // Fetch trip + activities
    const [{ data: trip }, { data: activities }] = await Promise.all([
      supabase.from("trips").select("name, destination, start_date, end_date").eq("id", tripId).single(),
      supabase.from("trip_activities")
        .select("id, title, place_name, address, activity_date, activity_time, duration_minutes, notes, lat, lng")
        .eq("trip_id", tripId)
        .not("activity_date", "is", null)
        .order("activity_date", { ascending: true })
        .order("activity_time", { ascending: true }),
    ]);

    if (!trip) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });

    const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const calName = escapeICS(`${trip.name || "Viaje"}${trip.destination ? ` — ${trip.destination}` : ""}`);

    const events = (activities ?? []).map((act) => {
      const title = escapeICS(act.title || act.place_name || "Actividad");
      const dtStart = formatICSDate(act.activity_date!, act.activity_time);
      const hasTime = Boolean(act.activity_time);

      // End time: start + duration (default 90min) or next day for all-day
      let dtEnd = dtStart;
      if (hasTime) {
        const [h, m] = (act.activity_time || "09:00").split(":").map(Number);
        const dur = act.duration_minutes || 90;
        const totalMin = h * 60 + m + dur;
        const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
        const endM = String(totalMin % 60).padStart(2, "0");
        dtEnd = formatICSDate(act.activity_date!, `${endH}:${endM}:00`);
      } else {
        // All-day: end = next day
        const d = new Date(`${act.activity_date}T00:00:00`);
        d.setDate(d.getDate() + 1);
        dtEnd = d.toISOString().slice(0, 10).replace(/-/g, "");
      }

      const location = act.address || act.place_name || "";
      const geo = act.lat && act.lng ? `${act.lat};${act.lng}` : "";
      const description = act.notes ? escapeICS(act.notes) : "";

      const lines = [
        "BEGIN:VEVENT",
        foldLine(`UID:kaviro-${act.id}@kaviro.app`),
        `DTSTAMP:${now}`,
        hasTime ? foldLine(`DTSTART:${dtStart}`) : foldLine(`DTSTART;VALUE=DATE:${dtStart}`),
        hasTime ? foldLine(`DTEND:${dtEnd}`) : foldLine(`DTEND;VALUE=DATE:${dtEnd}`),
        foldLine(`SUMMARY:${title}`),
        location ? foldLine(`LOCATION:${escapeICS(location)}`) : null,
        geo ? foldLine(`GEO:${geo}`) : null,
        description ? foldLine(`DESCRIPTION:${description}`) : null,
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");

      return lines;
    });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kaviro//Kaviro//ES",
      `X-WR-CALNAME:${calName}`,
      "X-WR-TIMEZONE:Europe/Madrid",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    const filename = `${(trip.name || "viaje").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    logger.error("Calendar export error:", err);
    return NextResponse.json({ error: "Error al generar el calendario" }, { status: 500 });
  }
}
