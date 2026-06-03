import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePermissions, normalizeRole } from "@/lib/permissions";
import { joinTripPlaces } from "@/lib/trip-places";
import { canUserDeleteTrip } from "@/lib/trips/can-delete-trip";
import { normalizeWeatherStays, validateWeatherStays } from "@/lib/trip-weather-stays";

export const runtime = "nodejs";
export const maxDuration = 60;

const DESC_MAX = 10_000;

type ParticipantGuardRow = {
  role: string | null;
  can_manage_trip: boolean | null;
  status?: string | null;
};

function canManageTripRow(row: ParticipantGuardRow) {
  const role = normalizeRole(row.role);
  return role === "owner" || Boolean(row.can_manage_trip);
}

async function loadParticipantRowsForUser(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const { data, error } = await supabase
    .from("trip_participants")
    .select(
      "role, can_manage_trip, can_manage_plan, can_manage_participants, can_manage_expenses, can_manage_map, can_manage_resources, status"
    )
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as ParticipantGuardRow[];
}

function pickParticipantRow(rows: ParticipantGuardRow[], options?: { allowRemovedOwner?: boolean }) {
  const active = rows.filter((r) => String(r.status || "active").toLowerCase() !== "removed");
  const pool = active.length ? active : options?.allowRemovedOwner ? rows : [];
  if (!pool.length) return null;
  return pool.find((r) => normalizeRole(r.role) === "owner") ?? pool[0]!;
}

async function requireCanManageTrip(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) return { ok: false as const, status: 401, error: "No autenticado." };

  const rows = await loadParticipantRowsForUser(supabase, tripId, user.id);
  const participant = pickParticipantRow(rows);
  if (!participant) return { ok: false as const, status: 403, error: "Sin acceso al viaje." };

  if (!canManageTripRow(participant)) {
    return { ok: false as const, status: 403, error: "No tienes permisos para editar el viaje." };
  }

  return { ok: true as const, supabase };
}

async function requireCanEditTripNotes(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) return { ok: false as const, status: 401, error: "No autenticado." };

  const { data: participant, error: participantError } = await supabase
    .from("trip_participants")
    .select(
      "role, can_manage_trip, can_manage_plan, can_manage_participants, can_manage_expenses, can_manage_map, can_manage_resources"
    )
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();
  if (participantError) throw new Error(participantError.message);
  if (!participant) return { ok: false as const, status: 403, error: "Sin acceso al viaje." };

  const role = normalizeRole((participant as { role?: string | null }).role);
  const perms = normalizePermissions(role, participant as Record<string, unknown>);
  const canTrip = role === "owner" || Boolean((participant as { can_manage_trip?: boolean }).can_manage_trip);
  const canPlan = Boolean(perms.can_manage_plan);
  if (!canTrip && !canPlan) {
    return { ok: false as const, status: 403, error: "No tienes permisos para editar las notas del viaje." };
  }

  return { ok: true as const, supabase };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const wantsMeta =
      body &&
      ("destination" in body ||
        "start_date" in body ||
        "end_date" in body ||
        "base_currency" in body ||
        "budget_target" in body ||
        "name" in body ||
        "weather_stays" in body);
    const wantsDescription = body && "description" in body;

    if (!wantsMeta && !wantsDescription) {
      return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
    }

    let supabase: Awaited<ReturnType<typeof createClient>>;

    if (wantsMeta) {
      const guard = await requireCanManageTrip(tripId);
      if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
      supabase = guard.supabase;
    } else {
      const guard = await requireCanEditTripNotes(tripId);
      if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
      supabase = guard.supabase;
    }

    const patch: Record<string, unknown> = {};

    if (wantsMeta) {
      const destinationInput = typeof body?.destination === "string" ? body.destination.trim() : "";
      const start_date = typeof body?.start_date === "string" ? body.start_date : null;
      const end_date = typeof body?.end_date === "string" ? body.end_date : null;
      const base_currency =
        typeof body?.base_currency === "string" ? body.base_currency.trim().toUpperCase() : null;

      if (start_date && end_date && start_date > end_date) {
        return NextResponse.json(
          { error: "La fecha de inicio no puede ser posterior a la fecha de fin." },
          { status: 400 }
        );
      }

      let normalizedStays: ReturnType<typeof normalizeWeatherStays> = [];
      if ("weather_stays" in body) {
        normalizedStays = normalizeWeatherStays(body.weather_stays);
        const stayErr = validateWeatherStays(normalizedStays, start_date, end_date);
        if (stayErr) return NextResponse.json({ error: stayErr }, { status: 400 });
        patch.weather_stays = normalizedStays;
      }

      const destinationFromStays = joinTripPlaces(normalizedStays.map((s) => s.city));
      patch.destination = destinationInput || destinationFromStays || null;
      patch.start_date = start_date || null;
      patch.end_date = end_date || null;
      patch.base_currency = base_currency && /^[A-Z]{3}$/.test(base_currency) ? base_currency : null;
      if (typeof body?.name === "string" && body.name.trim()) patch.name = body.name.trim();

      if ("budget_target" in body) {
        let budget: number | null = null;
        if (typeof body.budget_target === "number" && Number.isFinite(body.budget_target)) {
          budget = body.budget_target;
        } else if (typeof body.budget_target === "string") {
          const n = parseFloat(String(body.budget_target).replace(",", ".").trim());
          if (Number.isFinite(n)) budget = n;
        }
        patch.budget_target = budget != null && budget > 0 ? budget : null;
      }
    }

    if (wantsDescription) {
      const raw = (body as { description?: unknown }).description;
      if (raw !== null && typeof raw !== "string") {
        return NextResponse.json({ error: "El campo description debe ser texto o null." }, { status: 400 });
      }
      const trimmed = typeof raw === "string" ? raw.trim().slice(0, DESC_MAX) : "";
      patch.description = trimmed.length ? trimmed : null;
    }

    const warnings: string[] = [];
    let workingPatch = { ...patch };

    const buildSelect = (p: Record<string, unknown>) => {
      const cols = ["id", "name", "destination", "start_date", "end_date", "base_currency"];
      if ("budget_target" in p) cols.push("budget_target");
      if ("weather_stays" in p) cols.push("weather_stays");
      if (wantsDescription) cols.push("description");
      return cols.join(", ");
    };

    let { data, error } = await supabase
      .from("trips")
      .update(workingPatch)
      .eq("id", tripId)
      .select(buildSelect(workingPatch))
      .single();

    if (error && (error.message ?? "").includes("weather_stays") && "weather_stays" in workingPatch) {
      const { weather_stays: _ws, ...rest } = workingPatch;
      workingPatch = rest;
      warnings.push(
        "Las ciudades por fecha no se guardaron en JSON: ejecuta docs/kaviro_trips_weather_stays.sql. El destino general sí se actualizó."
      );
      const retry = await supabase
        .from("trips")
        .update(workingPatch)
        .eq("id", tripId)
        .select(buildSelect(workingPatch))
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error && (error.message ?? "").includes("budget_target") && "budget_target" in workingPatch) {
      const { budget_target: _bt, ...rest } = workingPatch;
      workingPatch = rest;
      warnings.push("El presupuesto no se guardó: ejecuta docs/kaviro_trips_budget_target.sql en Supabase.");
      const retry = await supabase
        .from("trips")
        .update(workingPatch)
        .eq("id", tripId)
        .select(buildSelect(workingPatch))
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);

    revalidatePath(`/trip/${tripId}/summary`);
    revalidatePath(`/trip/${tripId}/settings`);
    revalidatePath(`/trip/${tripId}/expenses`);

    return NextResponse.json({
      trip: data,
      warning: warnings.length ? warnings.join(" ") : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el viaje." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
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

    const guard = await canUserDeleteTrip(supabase, user.id, tripId);
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const { data: deleted, error } = await supabase.from("trips").delete().eq("id", tripId).select("id");
    if (error) throw new Error(error.message);
    if (!deleted?.length) {
      return NextResponse.json(
        {
          error:
            "No se pudo eliminar el viaje. Si eres el organizador, contacta con soporte: puede faltar permiso en la base de datos.",
        },
        { status: 403 }
      );
    }

    revalidatePath("/agency");
    revalidatePath("/agency/trips");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el viaje." },
      { status: 500 }
    );
  }
}

