import { NextResponse } from "next/server";
import { forbidUnlessCanManageMap, requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";

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
