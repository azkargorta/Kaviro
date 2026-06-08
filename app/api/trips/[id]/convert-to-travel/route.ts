import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";
import { convertExpenseGroupToTravel } from "@/lib/trips/convert-expense-group-to-travel";

export const runtime = "nodejs";

async function requireOwner(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const { data, error } = await supabase
    .from("trip_participants")
    .select("role, can_manage_trip, status")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .neq("status", "removed");

  if (error) return { ok: false as const, status: 500, error: error.message };
  const row = (data ?? []).find((r) => normalizeRole((r as { role?: string }).role) === "owner") ?? data?.[0];
  if (!row) return { ok: false as const, status: 403, error: "Sin acceso al grupo." };

  const role = normalizeRole((row as { role?: string }).role);
  const canManage =
    role === "owner" || Boolean((row as { can_manage_trip?: boolean }).can_manage_trip);
  if (!canManage) {
    return { ok: false as const, status: 403, error: "Solo quien gestiona el grupo puede convertirlo en viaje." };
  }

  return { ok: true as const };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const guard = await requireOwner(supabase, tripId, user.id);
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const body = await request.json().catch(() => null);
    const destination = typeof body?.destination === "string" ? body.destination : "";
    const start_date = typeof body?.start_date === "string" ? body.start_date : null;
    const end_date = typeof body?.end_date === "string" ? body.end_date : null;

    const result = await convertExpenseGroupToTravel(supabase, tripId, {
      destination,
      start_date,
      end_date,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    revalidatePath("/dashboard");
    revalidatePath(`/trip/${tripId}/summary`);
    revalidatePath(`/trip/${tripId}/expenses`);
    revalidatePath(`/trip/${tripId}/plan`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo convertir el grupo." },
      { status: 500 }
    );
  }
}
