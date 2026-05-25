import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, type, title, body, url, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ notifications: [], unreadCount: 0, tableMissing: true });
      }
      throw error;
    }

    const notifications = data ?? [];
    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar las notificaciones." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const action = body?.action === "mark_all_read" ? "mark_all_read" : null;
    if (!action) {
      return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Falta la tabla user_notifications. Ejecuta docs/kaviro_user_notifications.sql" },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron marcar las notificaciones." },
      { status: 500 }
    );
  }
}
