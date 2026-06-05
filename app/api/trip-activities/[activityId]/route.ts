import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInsertAudit } from "@/lib/audit";
import { normalizeInviteScope } from "@/lib/activity-invite-scope";
import {
  inviteFieldsFromBody,
  isMissingInviteScopeColumn,
  syncActivityInvitees,
} from "@/lib/activity-invitees-api";
import {
  forbidUnlessCanManagePlan,
  requireTripAccessApi,
} from "@/lib/trip-access-api";
import { notifyTripMembers } from "@/lib/server/notify-trip-members";
import {
  isLodgingActivityRow,
  lodgingReservationPatchFromActivity,
} from "@/lib/trip-activities/lodging-sync";
import {
  activityTitle,
  asTripActivityRow,
  linkedReservationId,
  type TripActivityRow,
} from "@/lib/trip-activities/types";

 export async function PATCH(request: Request, { params }: { params: { activityId: string } }) {
   try {
     const body = await request.json();
     const supabase = await createClient();
    const { data: actor } = await supabase.auth.getUser();
 
     const { data: row, error: rowError } = await supabase
       .from("trip_activities")
      .select("*")
       .eq("id", params.activityId)
       .maybeSingle();
     if (rowError) throw new Error(rowError.message);
     if (!row?.trip_id) return NextResponse.json({ error: "Actividad no encontrada." }, { status: 404 });
 
     const gate = await requireTripAccessApi(String(row.trip_id));
     if (!gate.ok) return gate.response;
     const forbidden = forbidUnlessCanManagePlan(gate.access, "No tienes permisos para editar actividades.");
     if (forbidden) return forbidden;
     const access = gate.access;
 
     const patch: Record<string, unknown> = {};
     const assign = (k: string, v: unknown) => {
       if (v !== undefined) patch[k] = v;
     };
 
     assign("sort_order", typeof body?.sort_order === "number" ? body.sort_order : undefined);
    assign("title", typeof body?.title === "string" ? body.title.trim() : undefined);
     assign("description", typeof body?.description === "string" ? body.description.trim() : undefined);
     assign("activity_date", typeof body?.activity_date === "string" ? body.activity_date : undefined);
     assign("activity_time", typeof body?.activity_time === "string" ? body.activity_time : undefined);
     assign("place_name", typeof body?.place_name === "string" ? body.place_name.trim() : undefined);
     assign("address", typeof body?.address === "string" ? body.address.trim() : undefined);
     assign("latitude", typeof body?.latitude === "number" ? body.latitude : undefined);
     assign("longitude", typeof body?.longitude === "number" ? body.longitude : undefined);
     assign("activity_type", typeof body?.activity_type === "string" ? body.activity_type : undefined);
     assign("activity_kind", typeof body?.activity_kind === "string" ? body.activity_kind : undefined);
    assign(
      "rating",
      typeof body?.rating === "number" &&
        Number.isFinite(body.rating) &&
        body.rating >= 1 &&
        body.rating <= 5
        ? Math.round(body.rating)
        : body?.rating === null
          ? null
          : undefined
    );
    assign("comment", typeof body?.comment === "string" ? body.comment.trim() : body?.comment === null ? null : undefined);

    const hasInvitePatch =
      body?.invite_scope !== undefined ||
      body?.inviteScope !== undefined ||
      body?.invited_participant_ids !== undefined ||
      body?.invitedParticipantIds !== undefined;
    const inviteFields = hasInvitePatch ? inviteFieldsFromBody(body) : null;
    if (inviteFields) {
      assign("invite_scope", inviteFields.invite_scope);
    }

    let { data, error } = await supabase
      .from("trip_activities")
      .update(patch)
      .eq("id", params.activityId)
      .select("*")
      .single();
    if (error && inviteFields && isMissingInviteScopeColumn(error.message)) {
      const retryPatch = { ...patch };
      delete retryPatch.invite_scope;
      ({ data, error } = await supabase
        .from("trip_activities")
        .update(retryPatch)
        .eq("id", params.activityId)
        .select("*")
        .single());
    }
    if (error) {
      const msg = error.message || "No se pudo actualizar la actividad.";
      if (msg.toLowerCase().includes("column") && (msg.toLowerCase().includes("rating") || msg.toLowerCase().includes("comment"))) {
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
 
    await safeInsertAudit(supabase, {
      trip_id: String(row.trip_id),
      entity_type: "activity",
      entity_id: String(data.id),
      action: "update",
      summary: `Actualizó plan: ${String(data.title || "").trim() || "Sin título"}`,
      diff: { before: row, patch, after: data },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    let inviteWarning: string | undefined;
    if (inviteFields) {
      const syncResult = await syncActivityInvitees(
        supabase,
        String(row.trip_id),
        String(data.id),
        inviteFields.invite_scope,
        inviteFields.invited_participant_ids,
        access
      );
      if (!syncResult.ok) inviteWarning = syncResult.warning;
    }

    const activityRow = asTripActivityRow(data);
    if (!activityRow) throw new Error("Respuesta de actividad inválida.");
    const activityPayload = {
      ...data,
      invite_scope:
        activityRow.invite_scope ??
        inviteFields?.invite_scope ??
        normalizeInviteScope(
          typeof (row as { invite_scope?: string }).invite_scope === "string"
            ? (row as { invite_scope: string }).invite_scope
            : undefined
        ),
      invited_participant_ids: inviteFields?.invited_participant_ids,
    };

    const linkedId = linkedReservationId(activityRow);
    if (linkedId && isLodgingActivityRow(activityRow)) {
      if (!access.can_manage_resources) {
        return NextResponse.json({
          activity: activityPayload,
          warning:
            inviteWarning ||
            "La actividad se guardó en el plan, pero no tienes permiso para actualizar Docs (reservas). Pide acceso de gestión de recursos o edita el alojamiento en Docs.",
        });
      }

      const { data: resRow, error: resErr } = await supabase
        .from("trip_reservations")
        .select("id, check_out_date, check_out_time")
        .eq("id", linkedId)
        .maybeSingle();
      if (resErr) throw new Error(resErr.message);

      const checkOutDate = typeof resRow?.check_out_date === "string" ? resRow.check_out_date : null;
      const checkOutTime = typeof resRow?.check_out_time === "string" ? resRow.check_out_time : null;

      const resPatch = lodgingReservationPatchFromActivity(activityRow, checkOutDate, checkOutTime);

      const { error: updResErr } = await supabase.from("trip_reservations").update(resPatch).eq("id", linkedId);
      if (updResErr) throw new Error(updResErr.message);
    }

    if (Object.keys(patch).length > 0 && actor?.user?.id) {
      const title = String((data as { title?: string | null })?.title || "").trim() || "una actividad";
      void notifyTripMembers({
        tripId: String(row.trip_id),
        actorUserId: actor.user.id,
        event: "activity_edited",
        detail: title,
        url: `/trip/${row.trip_id}/plan`,
      });
    }

     return NextResponse.json({
       activity: activityPayload,
       warning: inviteWarning,
     });
   } catch (error) {
     return NextResponse.json(
       { error: error instanceof Error ? error.message : "No se pudo actualizar la actividad." },
       { status: 500 }
     );
   }
 }
 
 export async function DELETE(_request: Request, { params }: { params: { activityId: string } }) {
   try {
     const supabase = await createClient();
    const { data: actor } = await supabase.auth.getUser();
 
     const { data: row, error: rowError } = await supabase
       .from("trip_activities")
      .select("*")
       .eq("id", params.activityId)
       .maybeSingle();
     if (rowError) throw new Error(rowError.message);
     if (!row?.trip_id) return NextResponse.json({ error: "Actividad no encontrada." }, { status: 404 });
 
     const gate = await requireTripAccessApi(String(row.trip_id));
     if (!gate.ok) return gate.response;
     const forbidden = forbidUnlessCanManagePlan(gate.access, "No tienes permisos para borrar actividades.");
     if (forbidden) return forbidden;
     const access = gate.access;

    const activityRow = asTripActivityRow(row);
    const reservationId = activityRow ? linkedReservationId(activityRow) : null;

    if (reservationId && activityRow && isLodgingActivityRow(activityRow)) {
      if (!access.can_manage_resources) {
        return NextResponse.json(
          {
            error:
              "Este alojamiento está vinculado a Docs (reserva). No tienes permiso para eliminarlo desde el plan; pide acceso de gestión de recursos o bórralo en Docs.",
          },
          { status: 403 }
        );
      }

      const { error: delActErr } = await supabase.from("trip_activities").delete().eq("linked_reservation_id", reservationId);
      if (delActErr) throw new Error(delActErr.message);

      const { error: delResErr } = await supabase.from("trip_reservations").delete().eq("id", reservationId);
      if (delResErr) throw new Error(delResErr.message);
    } else {
      const { error } = await supabase.from("trip_activities").delete().eq("id", params.activityId);
      if (error) throw new Error(error.message);
    }

    await safeInsertAudit(supabase, {
      trip_id: String(row.trip_id),
      entity_type: "activity",
      entity_id: String(row.id),
      action: "delete",
      summary: `Eliminó plan: ${activityRow ? activityTitle(activityRow) : "Sin título"}`,
      diff: { before: row },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

     return NextResponse.json({ ok: true });
   } catch (error) {
     return NextResponse.json(
       { error: error instanceof Error ? error.message : "No se pudo borrar la actividad." },
       { status: 500 }
     );
   }
 }
 
