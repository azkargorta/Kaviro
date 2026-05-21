import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfileAvatar } from "@/lib/profile-avatar";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const normalized = normalizeProfileAvatar({
      avatar_kind: body?.avatar_kind,
      avatar_emoji: body?.avatar_emoji,
      avatar_illustration: body?.avatar_illustration,
    });

    const { error } = await supabase
      .from("profiles")
      .update({ ...normalized, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      if (error.message.includes("avatar_kind")) {
        return NextResponse.json(
          { error: "Ejecuta docs/kaviro_social_features.sql en Supabase." },
          { status: 503 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, avatar: normalized });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar el avatar." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_kind, avatar_emoji, avatar_illustration")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return NextResponse.json({ avatar: data ?? {} });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el avatar." },
      { status: 500 }
    );
  }
}
