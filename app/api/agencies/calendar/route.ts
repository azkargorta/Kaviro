import { NextResponse } from "next/server";
import { requireAgencyApiContext } from "@/lib/require-agency-api";
import { getAgencyTrips } from "@/lib/agency";
import {
  classifyTripCalendarStatus,
  tripOverlapsMonth,
  type AgencyTripCalendarItem,
} from "@/lib/agency/calendar";

export async function GET(request: Request) {
  const gate = await requireAgencyApiContext();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;

  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Mes inválido." }, { status: 400 });
  }

  const trips = await getAgencyTrips(gate.ctx.supabase, gate.ctx.agency.id);
  const items: AgencyTripCalendarItem[] = trips
    .filter((t) => tripOverlapsMonth(t.start_date, t.end_date, year, month))
    .map((t) => ({
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

  return NextResponse.json({ year, month, trips: items });
}
