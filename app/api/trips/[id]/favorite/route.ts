import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const { data: participant, error: participantError } = await supabase
      .from("trip_participants")
      .select("is_favorite")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (participantError) throw new Error(participantError.message);
    if (!participant) return NextResponse.json({ error: "Sin acceso al viaje." }, { status: 403 });

    const newValue = !((participant as { is_favorite?: boolean }).is_favorite ?? false);

    const { error: updateError } = await supabase
      .from("trip_participants")
      .update({ is_favorite: newValue })
      .eq("trip_id", tripId)
      .eq("user_id", user.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ is_favorite: newValue });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar favorito." },
      { status: 500 }
    );
  }
}
