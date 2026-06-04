import { NextResponse } from "next/server";
import { requireAgencyApiContext } from "@/lib/require-agency-api";
import { getAgencyTrips } from "@/lib/agency";
import { buildIcsCalendar, classifyTripCalendarStatus, type AgencyTripCalendarItem } from "@/lib/agency/calendar";

export async function GET() {
  const gate = await requireAgencyApiContext();
  if (!gate.ok) return gate.response;

  const trips = await getAgencyTrips(gate.ctx.supabase, gate.ctx.agency.id);
  const items: AgencyTripCalendarItem[] = trips.map((t) => ({
    id: t.id,
    name: t.name,
    destination: t.destination,
    start_date: t.start_date,
    end_date: t.end_date,
    clientName: t.clientName,
    status: classifyTripCalendarStatus(t.start_date, t.end_date),
    operationsHref: `/agency/trips/${t.id}/operaciones`,
    planHref: `/trip/${t.id}/plan`,
  }));

  const ics = buildIcsCalendar(items, gate.ctx.agency.name);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kaviro-trips.ics"',
    },
  });
}
