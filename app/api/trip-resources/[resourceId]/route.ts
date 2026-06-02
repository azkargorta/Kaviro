 import { NextResponse } from "next/server";
 import { createClient } from "@/lib/supabase/server";
 import { forbidUnlessCanManageResources, requireTripAccessApi } from "@/lib/trip-access-api";
 
export async function PATCH(request: Request, { params }: { params: { resourceId: string } }) {
  try {
    const supabase = await createClient();
    const { data: row, error: rowError } = await supabase
      .from("trip_resources")
      .select("trip_id")
      .eq("id", params.resourceId)
      .maybeSingle();
    if (rowError) throw new Error(rowError.message);
    if (!row?.trip_id) return NextResponse.json({ error: "Recurso no encontrado." }, { status: 404 });

    const gate = await requireTripAccessApi(String(row.trip_id));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageResources(gate.access, "No tienes permisos para editar recursos.");
    if (forbidden) return forbidden;

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body?.show_on_client_portal === "boolean") {
      updates.show_on_client_portal = body.show_on_client_portal;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
    }

    const { data, error } = await gate.supabase
      .from("trip_resources")
      .update(updates)
      .eq("id", params.resourceId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ resource: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el recurso." },
      { status: 500 }
    );
  }
}

 export async function DELETE(_request: Request, { params }: { params: { resourceId: string } }) {
   try {
     const supabase = await createClient();
 
     const { data: row, error: rowError } = await supabase
       .from("trip_resources")
       .select("trip_id")
       .eq("id", params.resourceId)
       .maybeSingle();
     if (rowError) throw new Error(rowError.message);
     if (!row?.trip_id) return NextResponse.json({ error: "Recurso no encontrado." }, { status: 404 });
 
     const gate = await requireTripAccessApi(String(row.trip_id));
     if (!gate.ok) return gate.response;
     const forbidden = forbidUnlessCanManageResources(gate.access, "No tienes permisos para borrar recursos.");
     if (forbidden) return forbidden;
 
     const { error } = await gate.supabase.from("trip_resources").delete().eq("id", params.resourceId);
     if (error) throw new Error(error.message);
 
     return NextResponse.json({ ok: true });
   } catch (error) {
     return NextResponse.json(
       { error: error instanceof Error ? error.message : "No se pudo borrar el recurso." },
       { status: 500 }
     );
   }
 }
 
