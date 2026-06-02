import { NextResponse } from "next/server";
import { forbidUnlessCanManageMap, requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: { placeId: string } }) {
  try {
    const placeId = context.params.placeId;
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId || !placeId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos.");
    if (forbidden) return forbidden;

    const patch: Record<string, unknown> = {};
    if ("folderId" in body || "folder_id" in body) {
      const raw = body?.folderId ?? body?.folder_id;
      patch.folder_id = typeof raw === "string" && raw.trim() ? raw.trim() : null;
    }

    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const { data, error } = await gate.supabase
      .from("trip_places")
      .update(patch)
      .eq("id", placeId)
      .eq("trip_id", tripId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ place: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar el lugar." },
      { status: 500 }
    );
  }
}
