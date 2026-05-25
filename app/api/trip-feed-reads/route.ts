import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId")?.trim() || "";
    if (!tripId) return NextResponse.json({ error: "Falta tripId." }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.supabase
      .from("user_trip_feed_reads")
      .select("audit_log_id")
      .eq("user_id", gate.access.userId)
      .eq("trip_id", tripId);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ readLogIds: [], tableMissing: true });
      }
      throw error;
    }

    const readLogIds = (data ?? []).map((row) => String((row as { audit_log_id: string }).audit_log_id));
    return NextResponse.json({ readLogIds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar las lecturas." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
    const actionRaw = typeof body?.action === "string" ? body.action : "";

    if (!tripId) return NextResponse.json({ error: "Falta tripId." }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const now = new Date().toISOString();
    const userId = gate.access.userId;

    if (actionRaw === "validate_one") {
      const auditLogId = typeof body?.auditLogId === "string" ? body.auditLogId.trim() : "";
      if (!auditLogId) {
        return NextResponse.json({ error: "Falta auditLogId." }, { status: 400 });
      }

      const { error } = await gate.supabase.from("user_trip_feed_reads").upsert(
        {
          user_id: userId,
          trip_id: tripId,
          audit_log_id: auditLogId,
          read_at: now,
        },
        { onConflict: "user_id,trip_id,audit_log_id", ignoreDuplicates: true }
      );

      if (error) {
        if (error.code === "42P01") {
          return NextResponse.json(
            { error: "Falta la tabla user_trip_feed_reads. Ejecuta docs/kaviro_user_trip_feed_reads.sql" },
            { status: 503 }
          );
        }
        throw error;
      }

      return NextResponse.json({ ok: true, auditLogId });
    }

    if (actionRaw === "validate_all") {
      const rawIds = body?.auditLogIds;
      const auditLogIds = Array.isArray(rawIds)
        ? rawIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim())
        : [];

      if (auditLogIds.length === 0) {
        return NextResponse.json({ ok: true, readLogIds: [] });
      }

      const rows = auditLogIds.map((auditLogId) => ({
        user_id: userId,
        trip_id: tripId,
        audit_log_id: auditLogId,
        read_at: now,
      }));

      const { error } = await gate.supabase.from("user_trip_feed_reads").upsert(rows, {
        onConflict: "user_id,trip_id,audit_log_id",
        ignoreDuplicates: true,
      });

      if (error) {
        if (error.code === "42P01") {
          return NextResponse.json(
            { error: "Falta la tabla user_trip_feed_reads. Ejecuta docs/kaviro_user_trip_feed_reads.sql" },
            { status: 503 }
          );
        }
        throw error;
      }

      return NextResponse.json({ ok: true, readLogIds: auditLogIds });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron guardar las lecturas." },
      { status: 500 }
    );
  }
}
