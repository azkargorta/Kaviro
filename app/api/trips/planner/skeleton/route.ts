import { NextResponse } from "next/server";
import { generateSkeleton } from "@/lib/trip-planner/architect";
import type { TripBrief } from "@/lib/trip-planner/types";
import { totalDaysBetween } from "@/lib/trip-planner/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function isoOk(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseBriefFromBody(body: Record<string, unknown>): TripBrief | null {
  const destinations = Array.isArray(body.destinations)
    ? (body.destinations as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const sleepBases = Array.isArray(body.sleepBases)
    ? (body.sleepBases as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)
    : destinations;
  const startDate = String(body.startDate ?? body.start_date ?? "");
  const endDate = String(body.endDate ?? body.end_date ?? "");

  if (!sleepBases.length || !isoOk(startDate) || !isoOk(endDate)) return null;

  return {
    destinations,
    sleepBases,
    startDate,
    endDate,
    arrival: {
      place: body.arrivalPlace ? String(body.arrivalPlace) : null,
      date: isoOk(startDate) ? startDate : null,
      time: body.arrivalTime ? String(body.arrivalTime) : null,
    },
    departure: {
      place: body.departurePlace ? String(body.departurePlace) : null,
      date: isoOk(endDate) ? endDate : null,
      time: body.departureTime ? String(body.departureTime) : null,
    },
    transport: ["driving", "transit", "walking", "mixed"].includes(String(body.transport ?? ""))
      ? (String(body.transport) as TripBrief["transport"])
      : null,
    pace: ["relaxed", "balanced", "intense"].includes(String(body.pace ?? ""))
      ? (String(body.pace) as TripBrief["pace"])
      : null,
    travelersType: ["solo", "couple", "friends", "family"].includes(String(body.travelersType ?? ""))
      ? (String(body.travelersType) as TripBrief["travelersType"])
      : null,
    travelerCount: Number(body.travelerCount) || null,
    interests: Array.isArray(body.interests) ? (body.interests as string[]).filter(Boolean) : [],
    avoid: Array.isArray(body.avoid) ? (body.avoid as string[]).filter(Boolean) : [],
    mustDo: Array.isArray(body.mustDo) ? (body.mustDo as string[]).filter(Boolean) : [],
    constraints: Array.isArray(body.constraints) ? (body.constraints as string[]).filter(Boolean) : [],
    freeText: String(body.freeText ?? ""),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const brief = parseBriefFromBody(body);

    if (!brief) {
      return NextResponse.json({ error: "Faltan destinos o fechas." }, { status: 400 });
    }

    const totalDays = totalDaysBetween(brief.startDate, brief.endDate);
    if (totalDays > 30) {
      return NextResponse.json({ error: "Máximo 30 días por viaje." }, { status: 400 });
    }

    const refinementNotes =
      typeof body.refinementNotes === "string" && body.refinementNotes.trim() ? body.refinementNotes.trim() : "";

    const { skeleton, stops, skeletonText } = await generateSkeleton(brief, { refinementNotes });

    return NextResponse.json({
      ok: true,
      brief,
      skeleton,
      stops: stops.map((s) => ({ label: s.label, center: s.center })),
      skeletonText,
      totalDays,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar el esqueleto.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
