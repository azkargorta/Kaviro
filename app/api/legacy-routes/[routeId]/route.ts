import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbidUnlessCanManageMap, requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(
  _request: Request,
  { params }: { params: { routeId: string } }
) {
  try {
    const supabase = await createClient();

    const { data: routeRow, error: routeError } = await supabase
      .from("routes")
      .select("*")
      .eq("id", params.routeId)
      .maybeSingle();

    if (routeError) throw new Error(routeError.message);
    if (!routeRow?.trip_id) {
      return NextResponse.json({ error: "Ruta legacy no encontrada." }, { status: 404 });
    }

    const gate = await requireTripAccessApi(String(routeRow.trip_id));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageMap(gate.access, "No tienes permisos para borrar esta ruta.");
    if (forbidden) return forbidden;

    const { error } = await gate.supabase.from("routes").delete().eq("id", params.routeId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar la ruta legacy." },
      { status: 500 }
    );
  }
}
