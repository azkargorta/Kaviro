import { NextResponse } from "next/server";
import { forbidUnlessCanManageMap, requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: { folderId: string } }) {
  try {
    const folderId = context.params.folderId;
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId || !folderId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos.");
    if (forbidden) return forbidden;

    const patch: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body?.color === "string") patch.color = body.color.trim() || null;

    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const { data, error } = await gate.supabase
      .from("trip_place_folders")
      .update(patch)
      .eq("id", folderId)
      .eq("trip_id", tripId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ folder: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar la carpeta." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { folderId: string } }) {
  try {
    const folderId = context.params.folderId;
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId") || "";
    if (!tripId || !folderId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos.");
    if (forbidden) return forbidden;

    const { error } = await gate.supabase
      .from("trip_place_folders")
      .delete()
      .eq("id", folderId)
      .eq("trip_id", tripId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo eliminar la carpeta." },
      { status: 500 }
    );
  }
}
