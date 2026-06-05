import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Tab labels from path segments
const TAB_LABELS: Record<string, string> = {
  summary:      "Resumen",
  plan:         "Plan",
  map:          "Rutas",
  expenses:     "Gastos",
  participants: "Gente",
  resources:    "Docs",
  today:        "Hoy",
  recap:        "Recap",
  lists:        "Listas",
  settings:     "Ajustes",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    // Verify user is owner or manager
    const { data: participant } = await supabase
      .from("trip_participants")
      .select("role, can_manage_trip")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Sin acceso." }, { status: 403 });
    }

    const isOwnerOrManager =
      participant.role === "owner" ||
      Boolean(participant.can_manage_trip);

    if (!isOwnerOrManager) {
      return NextResponse.json({ error: "Solo el owner puede ver analytics." }, { status: 403 });
    }

    // Query page views for this trip's paths
    const tripPathPrefix = `/trip/${tripId}`;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: views, error: viewsError } = await supabase
      .from("site_page_views")
      .select("path, created_at")
      .like("path", `${tripPathPrefix}%`)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000);

    if (viewsError) throw viewsError;

    // Aggregate by tab
    const tabCounts = new Map<string, number>();
    const dailyCounts = new Map<string, number>();

    for (const view of views ?? []) {
      const path = typeof view.path === "string" ? view.path : "";
      const createdAt = typeof view.created_at === "string" ? view.created_at : "";
      // Extract tab from path: /trip/[id]/tab
      const segments = path.replace(tripPathPrefix, "").split("/").filter(Boolean);
      const tab = segments[0] || "summary";
      const label = TAB_LABELS[tab] ?? tab;
      tabCounts.set(label, (tabCounts.get(label) ?? 0) + 1);

      // Daily count
      const day = createdAt.slice(0, 10);
      dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
    }

    const tabs = [...tabCounts.entries()]
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);

    const daily = [...dailyCounts.entries()]
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    return NextResponse.json({
      total: views?.length ?? 0,
      tabs,
      daily,
      since: since.toISOString().slice(0, 10),
    });
  } catch (err) {
    logger.error("Trip analytics error:", err);
    return NextResponse.json({ error: "Error al cargar analytics." }, { status: 500 });
  }
}
