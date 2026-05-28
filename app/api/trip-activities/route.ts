import { NextResponse } from "next/server";
import { safeInsertAudit } from "@/lib/audit";
import {
  attachInvitedParticipantIds,
  filterActivitiesForViewer,
} from "@/lib/activity-invite-scope";
import {
  inviteFieldsFromBody,
  isMissingInviteScopeColumn,
  loadActivityInviteesForTrip,
  syncActivityInvitees,
} from "@/lib/activity-invitees-api";
import {
  forbidUnlessCanManagePlan,
  requireTripAccessApi,
} from "@/lib/trip-access-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const [{ data: trip, error: tripError }, { data: activities, error: activitiesError }] =
      await Promise.all([
        gate.supabase.from("trips").select("id, name, destination, start_date, end_date").eq("id", tripId).single(),
        gate.supabase
          .from("trip_activities")
          .select("*")
          .eq("trip_id", tripId)
          .order("activity_date", { ascending: true })
          .order("activity_time", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (tripError) throw new Error(tripError.message);
    if (activitiesError) throw new Error(activitiesError.message);

    const rows = activities || [];
    const activityIds = rows.map((a) => String((a as { id: string }).id)).filter(Boolean);
    let inviteesMap = new Map<string, string[]>();
    try {
      inviteesMap = await loadActivityInviteesForTrip(gate.supabase, tripId, activityIds);
    } catch {
      inviteesMap = new Map();
    }

    const withInvitees = attachInvitedParticipantIds(rows, inviteesMap);
    const visible = filterActivitiesForViewer(withInvitees, gate.access, inviteesMap);

    return NextResponse.json({ trip: trip || null, activities: visible });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el plan." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const forbidden = forbidUnlessCanManagePlan(gate.access, "No tienes permisos para crear actividades.");
    if (forbidden) return forbidden;

    const { access, supabase } = gate;
    const { data: actor } = await supabase.auth.getUser();
    const ratingRaw = body?.rating;
    const rating =
      typeof ratingRaw === "number" && Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
        ? Math.round(ratingRaw)
        : null;

    const { invite_scope, invited_participant_ids } = inviteFieldsFromBody(body);

    const payload: Record<string, unknown> = {
      trip_id: tripId,
      title: typeof body?.title === "string" ? body.title.trim() : null,
      description: typeof body?.description === "string" ? body.description.trim() : null,
      rating,
      comment: typeof body?.comment === "string" ? body.comment.trim() : null,
      activity_date: typeof body?.activity_date === "string" ? body.activity_date : null,
      activity_time: typeof body?.activity_time === "string" ? body.activity_time : null,
      place_name: typeof body?.place_name === "string" ? body.place_name.trim() : null,
      address: typeof body?.address === "string" ? body.address.trim() : null,
      latitude: typeof body?.latitude === "number" ? body.latitude : null,
      longitude: typeof body?.longitude === "number" ? body.longitude : null,
      activity_type: typeof body?.activity_type === "string" ? body.activity_type : null,
      activity_kind: typeof body?.activity_kind === "string" ? body.activity_kind : null,
      source: typeof body?.source === "string" ? body.source : "manual",
      created_by_user_id:
        typeof body?.created_by_user_id === "string" ? body.created_by_user_id : access.userId,
      invite_scope,
    };

    if (!payload.title) return NextResponse.json({ error: "Falta title" }, { status: 400 });

    let insertPayload = { ...payload };
    let { data, error } = await supabase.from("trip_activities").insert(insertPayload).select("*").single();
    if (error && isMissingInviteScopeColumn(error.message)) {
      const { invite_scope: _omit, ...withoutScope } = insertPayload;
      insertPayload = withoutScope;
      ({ data, error } = await supabase.from("trip_activities").insert(insertPayload).select("*").single());
    }
    if (error) {
      const msg = error.message || "No se pudo crear la actividad.";
      if (
        msg.toLowerCase().includes("column") &&
        (msg.toLowerCase().includes("rating") || msg.toLowerCase().includes("comment"))
      ) {
        return NextResponse.json(
          {
            error:
              "La tabla `trip_activities` no tiene las columnas `rating`/`comment`. Ejecuta el script `docs/tripboard_plan_ratings_comments.sql` en la SQL editor de Supabase y vuelve a probar.",
          },
          { status: 400 }
        );
      }
      throw new Error(msg);
    }

    const syncResult = await syncActivityInvitees(
      supabase,
      tripId,
      String(data.id),
      invite_scope,
      invited_participant_ids,
      access
    );

    await safeInsertAudit(supabase, {
      trip_id: tripId,
      entity_type: "activity",
      entity_id: String(data.id),
      action: "create",
      summary: `Creó actividad: ${String(data.title || "").trim() || "Actividad"}`,
      diff: { after: data },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    return NextResponse.json({
      activity: {
        ...data,
        invite_scope: (data as { invite_scope?: string }).invite_scope ?? invite_scope,
        invited_participant_ids,
      },
      warning: syncResult.ok ? undefined : syncResult.warning,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la actividad." },
      { status: 500 }
    );
  }
}
