/**
 * POST /api/admin/stripes-demo
 * Crea el viaje demo de Stripes × Kaviro para el usuario fidel@stripes.es
 * Solo accesible para administradores de la plataforma.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/platform-admin";
import {
  STRIPES_TRIP_NAME,
  STRIPES_TRIP_DESTINATION,
  STRIPES_TRIP_BASE_CURRENCY,
  STRIPES_GHOST_PARTICIPANTS,
  buildStripesActivities,
  buildStripesExpenses,
} from "@/lib/onboarding/stripes-demo-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

function stripesDateRange() {
  // Fijo: 11 oct 2026 → 17 oct 2026 (Bears at Packers el 11, Bulls el 15)
  return { start_date: "2026-10-10", end_date: "2026-10-17" };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const isAdmin = await isPlatformAdmin(user.id, user.email ?? "");
    if (!isAdmin) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

    const admin = createSupabaseAdmin();

    // 1. Buscar o crear el usuario fidel@stripes.es
    let fidelId: string;
    const { data: existingUser } = await admin.auth.admin.listUsers();
    const fidelUser = existingUser?.users?.find((u) => u.email === "fidel@stripes.es");

    if (fidelUser) {
      fidelId = fidelUser.id;
    } else {
      // Crear usuario
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: "fidel@stripes.es",
        password: "12345678",
        email_confirm: true,
        user_metadata: {
          full_name: "Fidel Márquez",
          username: "fidel",
        },
      });
      if (createError || !newUser?.user) {
        return NextResponse.json({ error: createError?.message || "No se pudo crear el usuario." }, { status: 500 });
      }
      fidelId = newUser.user.id;
    }

    // 2. Asegurarse de que el perfil tiene username @fidel
    await admin.from("profiles").upsert({
      id: fidelId,
      username: "fidel",
      display_name: "Fidel Márquez",
      avatar_emoji: "🏈",
      avatar_kind: "emoji",
    }, { onConflict: "id" });

    // 3. Comprobar si ya tiene el viaje de Stripes
    const { data: existingTrip } = await admin
      .from("trips")
      .select("id")
      .eq("name", STRIPES_TRIP_NAME)
      .maybeSingle();

    if (existingTrip?.id) {
      return NextResponse.json({
        ok: true,
        message: "El viaje Stripes ya existe.",
        tripId: existingTrip.id,
        fidelId,
        alreadyExisted: true,
      });
    }

    // 4. Crear el viaje
    const { start_date, end_date } = stripesDateRange();
    const { data: trip, error: tripError } = await admin
      .from("trips")
      .insert({
        name: STRIPES_TRIP_NAME,
        destination: STRIPES_TRIP_DESTINATION,
        start_date,
        end_date,
        base_currency: STRIPES_TRIP_BASE_CURRENCY,
        is_demo: false,
        category: "sports",
        partner: "stripes",
      })
      .select("id")
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: tripError?.message || "No se pudo crear el viaje." }, { status: 500 });
    }

    const tripId = String((trip as { id: string }).id);

    // 5. Fidel como owner
    await admin.from("trip_participants").insert({
      trip_id: tripId,
      display_name: "Fidel",
      username: "fidel",
      user_id: fidelId,
      role: "owner",
      status: "active",
      joined_via: "stripes_demo",
      linked_at: new Date().toISOString(),
      can_manage_trip: true,
      can_manage_participants: true,
      can_manage_expenses: true,
      can_manage_plan: true,
      can_manage_map: true,
      can_manage_resources: true,
    });

    // 6. Participantes del grupo
    for (const ghost of STRIPES_GHOST_PARTICIPANTS) {
      if (ghost.display_name === "Fidel") continue;
      await admin.from("trip_participants").insert({
        trip_id: tripId,
        display_name: ghost.display_name,
        role: ghost.role,
        status: "active",
        joined_via: "stripes_demo",
        user_id: null,
      });
    }

    // 7. Actividades
    const activities = buildStripesActivities(start_date);
    await admin.from("trip_activities").insert(
      activities.map((a) => ({
        trip_id: tripId,
        title: a.title,
        activity_date: a.activity_date,
        activity_time: a.activity_time,
        place_name: a.place_name,
        address: a.address,
        activity_kind: a.activity_kind,
        latitude: a.latitude,
        longitude: a.longitude,
        ...(a.rating != null ? { rating: a.rating } : {}),
        ...(a.comment != null ? { comment: a.comment } : {}),
        ...(a.notes != null ? { notes: a.notes } : {}),
        source: "stripes_demo",
        created_by_user_id: fidelId,
      }))
    );

    // 8. Gastos
    const expenses = buildStripesExpenses(start_date);
    for (const e of expenses) {
      await admin.from("trip_expenses").insert({
        trip_id: tripId,
        title: e.description,
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        expense_date: e.date,
        payer_name: e.paid_by_name,
        participant_names: STRIPES_GHOST_PARTICIPANTS.map((p) => p.display_name),
        paid_by_names: [e.paid_by_name],
        owed_by_names: STRIPES_GHOST_PARTICIPANTS.map((p) => p.display_name),
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Viaje Stripes × Kaviro creado correctamente.",
      tripId,
      fidelId,
      activitiesCount: activities.length,
      expensesCount: expenses.length,
      participantsCount: STRIPES_GHOST_PARTICIPANTS.length,
    });

  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno." },
      { status: 500 }
    );
  }
}
