import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInsertAudit } from "@/lib/audit";
import {
  forbidUnlessCanManageMap,
  requireTripAccessApi,
} from "@/lib/trip-access-api";
import {
  buildTripRoutePayload,
  omitPayloadKey,
  routeDisplayTitle,
} from "@/lib/trip-routes/payload";

async function insertWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>
) {
  let response = await supabase.from("trip_routes").insert(payload).select("*").single();
  if (!response.error) return response;

  const message = response.error.message.toLowerCase();
  if (message.includes("color") && message.includes("schema cache")) {
    response = await supabase
      .from("trip_routes")
      .insert(omitPayloadKey(payload, "color"))
      .select("*")
      .single();
    return response;
  }
  if (message.includes("notes") && message.includes("schema cache")) {
    response = await supabase
      .from("trip_routes")
      .insert(omitPayloadKey(payload, "notes"))
      .select("*")
      .single();
    return response;
  }

  if (!message.includes("route_order")) return response;

  response = await supabase
    .from("trip_routes")
    .insert(omitPayloadKey(payload, "route_order"))
    .select("*")
    .single();
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;

    if (!tripId) {
      return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos para crear rutas.");
    if (forbidden) return forbidden;

    const { supabase } = gate;
    const { data: actor } = await supabase.auth.getUser();
    const payload = buildTripRoutePayload(body);
    const response = await insertWithFallback(supabase, payload);

    if (response.error) throw new Error(response.error.message);

    await safeInsertAudit(supabase, {
      trip_id: tripId,
      entity_type: "route",
      entity_id: String(response.data.id),
      action: "create",
      summary: `Creó ruta: ${routeDisplayTitle(response.data)}`,
      diff: { after: response.data },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    return NextResponse.json({ route: response.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la ruta." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.supabase
      .from("trip_routes")
      .select("*")
      .eq("trip_id", tripId)
      .order("route_day", { ascending: true })
      .order("route_order", { ascending: true, nullsFirst: false })
      .order("departure_time", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ routes: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar las rutas." },
      { status: 500 }
    );
  }
}
