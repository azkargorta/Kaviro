/**
 * POST /api/admin/stripes-demo
 * Crea el viaje demo de Stripes × Kaviro para el usuario fidel@stripes.es
 * Solo accesible para administradores de la plataforma.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { STRIPES_TRIP_NAME } from "@/lib/onboarding/stripes-demo-seed";
import { createStripesTripForUser } from "@/lib/onboarding/createStripesTrip";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No hay sesión." }, { status: 401 });

    const isAdmin = await isPlatformAdmin(user.id, user.email ?? "");
    if (!isAdmin) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

    const admin = createSupabaseAdmin();

    let fidelId: string;
    const { data: existingUser } = await admin.auth.admin.listUsers();
    const fidelUser = existingUser?.users?.find((u) => u.email === "fidel@stripes.es");

    if (fidelUser) {
      fidelId = fidelUser.id;
    } else {
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

    await admin.from("profiles").upsert({
      id: fidelId,
      username: "fidel",
      display_name: "Fidel Márquez",
      avatar_emoji: "🏈",
      avatar_kind: "emoji",
    }, { onConflict: "id" });

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

    const fidelUserObj = fidelUser ?? (await admin.auth.admin.getUserById(fidelId)).data.user;
    if (!fidelUserObj) {
      return NextResponse.json({ error: "No se pudo cargar el usuario fidel@stripes.es." }, { status: 500 });
    }

    const result = await createStripesTripForUser(fidelUserObj);

    return NextResponse.json({
      ok: true,
      message: "Viaje Stripes × Kaviro creado correctamente.",
      tripId: result.tripId,
      fidelId,
      created: result.created,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno." },
      { status: 500 }
    );
  }
}
