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

    const { count: unreadCount, error: countError } = await supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (countError && countError.code !== "42P01") {
      throw countError;
    }

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount ?? notifications.filter((n) => !n.read_at).length,
    });
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
    const actionRaw = typeof body?.action === "string" ? body.action : "";
    const now = new Date().toISOString();

    async function unreadCountForUser() {
      const { count, error: countError } = await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (countError) throw countError;
      return count ?? 0;
    }

    if (actionRaw === "validate_all" || actionRaw === "mark_all_read") {
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

      return NextResponse.json({ ok: true, unreadCount: 0 });
    }

    if (actionRaw === "validate_one" || actionRaw === "mark_read") {
      const id = typeof body?.id === "string" ? body.id.trim() : "";
      if (!id) {
        return NextResponse.json({ error: "Falta el id de la notificación." }, { status: 400 });
      }

      const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: now })
        .eq("user_id", user.id)
        .eq("id", id)
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

      const unreadCount = await unreadCountForUser();
      return NextResponse.json({ ok: true, unreadCount, id });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron marcar las notificaciones." },
      { status: 500 }
    );
  }
}
