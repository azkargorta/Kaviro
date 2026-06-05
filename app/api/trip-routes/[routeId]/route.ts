import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbidUnlessCanManageMap, requireTripAccessApi } from "@/lib/trip-access-api";
import { safeInsertAudit } from "@/lib/audit";
import {
  buildTripRoutePatchPayload,
  omitPayloadKey,
  routeDisplayTitle,
} from "@/lib/trip-routes/payload";

async function patchWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  routeId: string,
  payload: Record<string, unknown>
) {
  let response = await supabase.from("trip_routes").update(payload).eq("id", routeId).select("*").single();
  if (!response.error) return response;

  const message = response.error.message.toLowerCase();
  if (message.includes("color") && message.includes("schema cache")) {
    response = await supabase
      .from("trip_routes")
      .update(omitPayloadKey(payload, "color"))
      .eq("id", routeId)
      .select("*")
      .single();
    return response;
  }
  if (message.includes("notes") && message.includes("schema cache")) {
    response = await supabase
      .from("trip_routes")
      .update(omitPayloadKey(payload, "notes"))
      .eq("id", routeId)
      .select("*")
      .single();
    return response;
  }
  if (!message.includes("route_order")) return response;

  response = await supabase
    .from("trip_routes")
    .update(omitPayloadKey(payload, "route_order"))
    .eq("id", routeId)
    .select("*")
    .single();
  return response;
}

export async function PATCH(request: Request, { params }: { params: { routeId: string } }) {
  try {
    const body = await request.json();
    const payload = buildTripRoutePatchPayload(body);
    const supabase = await createClient();
    const { data: actor } = await supabase.auth.getUser();

    const { data: routeRow, error: routeError } = await supabase
      .from("trip_routes")
      .select("*")
      .eq("id", params.routeId)
      .maybeSingle();
    if (routeError) throw new Error(routeError.message);
    if (!routeRow?.trip_id) {
      return NextResponse.json({ error: "Ruta no encontrada." }, { status: 404 });
    }
    const gate = await requireTripAccessApi(String(routeRow.trip_id));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos para editar rutas.");
    if (forbidden) return forbidden;

    const response = await patchWithFallback(supabase, params.routeId, payload);

    if (response.error) throw new Error(response.error.message);

    await safeInsertAudit(supabase, {
      trip_id: String(routeRow.trip_id),
      entity_type: "route",
      entity_id: String(response.data.id),
      action: "update",
      summary: `Actualizó ruta: ${routeDisplayTitle(response.data)}`,
      diff: { before: routeRow, patch: payload, after: response.data },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    return NextResponse.json({ route: response.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar la ruta." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { routeId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: actor } = await supabase.auth.getUser();

    const { data: routeRow, error: routeError } = await supabase
      .from("trip_routes")
      .select("*")
      .eq("id", params.routeId)
      .maybeSingle();
    if (routeError) throw new Error(routeError.message);
    if (!routeRow?.trip_id) {
      return NextResponse.json({ error: "Ruta no encontrada." }, { status: 404 });
    }
    const gate = await requireTripAccessApi(String(routeRow.trip_id));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos para borrar rutas.");
    if (forbidden) return forbidden;

    const response = await supabase.from("trip_routes").delete().eq("id", params.routeId);
    if (response.error) throw new Error(response.error.message);

    await safeInsertAudit(supabase, {
      trip_id: String(routeRow.trip_id),
      entity_type: "route",
      entity_id: String(routeRow.id),
      action: "delete",
      summary: `Eliminó ruta: ${routeDisplayTitle(routeRow)}`,
      diff: { before: routeRow },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar la ruta." },
      { status: 500 }
    );
  }
}
