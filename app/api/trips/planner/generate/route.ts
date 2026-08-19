import { NextResponse } from "next/server";
import { generateDetail } from "@/lib/trip-planner/detailer";
import { validateAndGeocode } from "@/lib/trip-planner/validator";
import type { TripBrief, TripSkeleton, TripItinerary } from "@/lib/trip-planner/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type LatLng = { lat: number; lng: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const brief = body.brief as TripBrief | undefined;
    const skeleton = body.skeleton as TripSkeleton | undefined;
    const stops = body.stops as Array<{ label: string; center: LatLng }> | undefined;

    if (!brief || !skeleton?.days?.length) {
      return NextResponse.json({ error: "Faltan brief o skeleton." }, { status: 400 });
    }

    const days = await generateDetail(brief, skeleton);

    const baseCenters = new Map<string, LatLng>();
    if (stops?.length) {
      for (const s of stops) {
        baseCenters.set(s.label.toLowerCase(), s.center);
      }
    }

    const destinationLabel = brief.destinations.join(" · ") || brief.sleepBases.join(" · ");
    const validated = await validateAndGeocode(days, baseCenters, destinationLabel);

    const itinerary: TripItinerary = {
      brief,
      skeleton,
      days: validated,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, itinerary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar el itinerario.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
