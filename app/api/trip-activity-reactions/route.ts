import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getTripAccessForApi } from "@/lib/trip-access";
import {
  buildDemoAttendanceReactions,
  isDemoTripForAttendance,
} from "@/lib/onboarding/demo-activity-attendance-seed";

export const runtime = "nodejs";

export type Reaction = {
  id: string;
  user_id: string;
  display_name: string;
  reaction: "join" | "skip" | "maybe";
  comment: string | null;
};

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireTripParticipant(tripId: string) {
  const supabase = await createClient();
  const result = await getTripAccessForApi(supabase, tripId);
  if (!result.ok) {
    return { ok: false as const, status: result.status, error: result.error };
  }
  return { ok: true as const, access: result.access };
}

// GET /api/trip-activity-reactions?tripId=X — todas las respuestas del viaje
// GET /api/trip-activity-reactions?tripId=X&activityId=Y — una actividad
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId") ?? "";
    const activityId = searchParams.get("activityId") ?? "";
    if (!tripId) return NextResponse.json({ reactions: [], tableReady: true });

    const accessResult = await requireTripParticipant(tripId);
    if (!accessResult.ok) {
      return apiError(accessResult.error, accessResult.status);
    }

    const admin = getServiceRoleClient();

    if (!activityId) {
      const [{ data, error }, { count: participantCount, error: participantsError }] = await Promise.all([
        admin
          .from("trip_activity_reactions")
          .select("id, user_id, display_name, reaction, comment, activity_id")
          .eq("trip_id", tripId)
          .order("created_at"),
        admin
          .from("trip_participants")
          .select("id", { count: "exact", head: true })
          .eq("trip_id", tripId)
          .neq("status", "removed"),
      ]);

      if (error) {
        if (isMissingTableError(error)) {
          return NextResponse.json({ reactions: [], tableReady: false, participantCount: 0 });
        }
        return apiError(error.message || "No se pudieron cargar las respuestas.", 500);
      }

      if (participantsError) {
        return NextResponse.json({
          reactions: data ?? [],
          tableReady: true,
          participantCount: null,
        });
      }

      let reactions = data ?? [];

      const { data: tripRow } = await admin
        .from("trips")
        .select("is_demo, name")
        .eq("id", tripId)
        .maybeSingle();

      if (tripRow && isDemoTripForAttendance(tripRow as { is_demo?: boolean; name?: string })) {
        const { data: actRows } = await admin
          .from("trip_activities")
          .select("id, title")
          .eq("trip_id", tripId);

        const { data: ownerParticipant } = await admin
          .from("trip_participants")
          .select("display_name")
          .eq("trip_id", tripId)
          .eq("user_id", accessResult.access.userId)
          .maybeSingle();

        const ownerName =
          String((ownerParticipant as { display_name?: string } | null)?.display_name || "").trim() ||
          "Tú";

        const demoRows = buildDemoAttendanceReactions(
          tripId,
          (actRows ?? []) as Array<{ id: string; title: string }>,
          ownerName
        );

        const seen = new Set(
          reactions.map((r) => `${String(r.activity_id)}:${String(r.user_id)}`)
        );
        for (const row of demoRows) {
          const actId = row.activity_id;
          if (!actId) continue;
          const key = `${actId}:${row.user_id}`;
          if (!seen.has(key)) {
            reactions.push({
              id: row.id,
              user_id: row.user_id,
              display_name: row.display_name,
              reaction: row.reaction,
              comment: row.comment,
              activity_id: actId,
            });
            seen.add(key);
          }
        }
      }

      return NextResponse.json({
        reactions,
        tableReady: true,
        participantCount: participantCount ?? 0,
      });
    }

    const { data, error } = await admin
      .from("trip_activity_reactions")
      .select("id, user_id, display_name, reaction, comment")
      .eq("activity_id", activityId)
      .order("created_at");

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ reactions: [], tableReady: false });
      }
      return apiError(error.message || "No se pudieron cargar las respuestas.", 500);
    }

    return NextResponse.json({ reactions: data ?? [], tableReady: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudieron cargar las respuestas.";
    return apiError(msg, 500);
  }
}

// POST /api/trip-activity-reactions
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const tripId = String(body?.tripId || "");
    const activityId = String(body?.activityId || "");
    const reaction = String(body?.reaction || "");
    const comment = body?.comment ? String(body.comment).trim().slice(0, 500) : null;
    const displayName = body?.displayName ? String(body.displayName).trim().slice(0, 60) : "Anónimo";

    if (!tripId || !activityId || !["join", "skip", "maybe"].includes(reaction)) {
      return apiError("Datos inválidos.", 400);
    }

    const accessResult = await requireTripParticipant(tripId);
    if (!accessResult.ok) {
      return apiError(accessResult.error, accessResult.status);
    }

    const admin = getServiceRoleClient();
    const { error } = await admin.from("trip_activity_reactions").upsert(
      {
        trip_id: tripId,
        activity_id: activityId,
        user_id: accessResult.access.userId,
        display_name: displayName,
        reaction,
        comment,
      },
      { onConflict: "activity_id,user_id" }
    );

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            ok: false,
            tableReady: false,
            error:
              "Falta la tabla de respuestas. Ejecuta docs/tripboard_activity_reactions.sql en Supabase.",
          },
          { status: 503 }
        );
      }
      return apiError(error.message || "No se pudo guardar tu respuesta.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar tu respuesta.";
    return apiError(msg, 500);
  }
}

// DELETE /api/trip-activity-reactions?tripId=X&activityId=Y
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId") ?? "";
    const activityId = searchParams.get("activityId") ?? "";
    if (!tripId || !activityId) return apiError("Faltan parámetros.", 400);

    const accessResult = await requireTripParticipant(tripId);
    if (!accessResult.ok) {
      return apiError(accessResult.error, accessResult.status);
    }

    const admin = getServiceRoleClient();
    const { error } = await admin
      .from("trip_activity_reactions")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", accessResult.access.userId);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ ok: false, tableReady: false }, { status: 503 });
      }
      return apiError(error.message || "No se pudo quitar tu respuesta.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo quitar tu respuesta.";
    return apiError(msg, 500);
  }
}
