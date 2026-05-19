import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getTripAccessForApi } from "@/lib/trip-access";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLE = "trip_shares";

async function requireCanShareTrip(tripId: string) {
  const supabase = await createClient();
  const result = await getTripAccessForApi(supabase, tripId);
  if (!result.ok) {
    const err = new Error(result.error);
    (err as any).status = result.status;
    throw err;
  }
  const { access } = result;
  // Owners can always share; other roles need can_manage_resources
  if (access.role !== "owner" && !access.can_manage_resources) {
    const err = new Error("No tienes permisos para compartir este viaje.");
    (err as any).status = 403;
    throw err;
  }
  return access;
}

function makeToken() {
  // Token URL-safe, sin guiones.
  return crypto.randomUUID().replace(/-/g, "");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tripId = url.searchParams.get("tripId") || "";
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const access = await requireCanShareTrip(tripId);
    const admin = getServiceRoleClient();

    const { data, error } = await admin
      .from(TABLE)
      .select("token, trip_id, revoked_at, created_at")
      .eq("trip_id", tripId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({ share: data || null, tripId, userId: access.userId }, { status: 200 });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el enlace público." },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const access = await requireCanShareTrip(tripId);
    const admin = getServiceRoleClient();

    // Reutilizar enlace activo si ya existe
    const existing = await admin
      .from(TABLE)
      .select("token, trip_id, revoked_at, created_at")
      .eq("trip_id", tripId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.token) {
      return NextResponse.json({ share: existing.data }, { status: 200 });
    }

    const token = makeToken();

    const { data, error } = await admin
      .from(TABLE)
      .insert({
        token,
        trip_id: tripId,
        created_by_user_id: access.userId,
        revoked_at: null,
        expires_at: null,
      })
      .select("token, trip_id, revoked_at, created_at")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ share: data }, { status: 201 });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el enlace público." },
      { status }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    await requireCanShareTrip(tripId);
    const admin = getServiceRoleClient();

    const now = new Date().toISOString();
    const { error } = await admin
      .from(TABLE)
      .update({ revoked_at: now })
      .eq("trip_id", tripId)
      .is("revoked_at", null);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo revocar el enlace público." },
      { status }
    );
  }
}

