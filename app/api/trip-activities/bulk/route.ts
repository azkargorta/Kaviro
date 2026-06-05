import { NextResponse } from "next/server";
import { forbidUnlessCanManagePlan, requireTripAccessApi } from "@/lib/trip-access-api";
import { safeInsertAudit } from "@/lib/audit";
import { geocodePhotonPreferred, geocodeTripAnchor, regionHintsFromDestination } from "@/lib/geocoding/photonGeocode";
import { isLodgingActivityRow } from "@/lib/trip-activities/lodging-sync";
import type { BulkActivityInput, BulkActivityInsertRow } from "@/lib/trip-activities/types";
import { linkedReservationId } from "@/lib/trip-activities/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanString(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function coordsValid(lat: number | null, lng: number | null): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Math.abs(lat) > 0.001 &&
    Math.abs(lng) > 0.001 &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    const activities = Array.isArray(body?.activities) ? (body.activities as BulkActivityInput[]) : [];

    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    if (!activities.length) return NextResponse.json({ error: "Faltan activities" }, { status: 400 });

    const gate = await requireTripAccessApi(String(tripId));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManagePlan(gate.access, "No tienes permisos.");
    if (forbidden) return forbidden;

    const { access, supabase } = gate;
    const { data: actor } = await supabase.auth.getUser();

    // Fetch trip destination for geocode anchor (improves accuracy)
    const { data: tripRow } = await supabase
      .from("trips")
      .select("destination")
      .eq("id", tripId)
      .maybeSingle();
    const tripDestination = typeof tripRow?.destination === "string" ? tripRow.destination : null;
    const anchor = await geocodeTripAnchor(tripDestination);
    const regionHints = regionHintsFromDestination(tripDestination);

    // Build initial rows
    const rows = activities
      .map((a): BulkActivityInsertRow | null => {
        const title = cleanString(a.title);
        if (!title) return null;
        return {
          trip_id: tripId,
          title,
          description: cleanString(a.description),
          activity_date: cleanString(a.activity_date),
          activity_time: cleanString(a.activity_time),
          place_name: cleanString(a.place_name),
          address: cleanString(a.address),
          latitude: numOrNull(a.latitude),
          longitude: numOrNull(a.longitude),
          activity_type: cleanString(a.activity_type) ?? "general",
          activity_kind: cleanString(a.activity_kind) ?? "visit",
          source: cleanString(a.source) ?? "ai_planner",
          created_by_user_id: access.userId,
        };
      })
      .filter((row): row is BulkActivityInsertRow => row !== null);

    if (!rows.length) return NextResponse.json({ error: "No hay filas válidas para insertar." }, { status: 400 });

    const skipGeocode = body?.skipGeocode === true;
    const bulkFromAiPlanner =
      rows.length >= 6 && rows.every((r: { source?: string | null }) => r.source === "ai_planner");

    // Geocode en bulk masivo (p. ej. autocreador) puede superar timeout → omitir si el cliente lo pide
    // o si son muchas actividades del planificador IA (suelen traer coords o se rellenan en mapa después).
    if (!skipGeocode && !bulkFromAiPlanner) {
      await Promise.all(
        rows.map(async (row) => {
          if (coordsValid(row.latitude, row.longitude)) return;
          if (row.activity_kind === "transport") return;

          const query = cleanString(row.place_name || row.title);
          if (!query) return;

          try {
            const g = await geocodePhotonPreferred(query, {
              anchor,
              regionHints,
              maxDistanceKm: 50000,
            });
            if (g && coordsValid(g.lat, g.lng)) {
              row.latitude = g.lat;
              row.longitude = g.lng;
              if (!row.address && g.label) row.address = g.label;
            }
          } catch {
            /* geocode opcional */
          }
        })
      );
    }

    const { data, error } = await supabase.from("trip_activities").insert(rows).select("id, title");
    if (error) throw new Error(error.message || "No se pudieron crear actividades.");

    await safeInsertAudit(supabase, {
      trip_id: String(tripId),
      entity_type: "activity",
      entity_id: "bulk",
      action: "create",
      summary: `Creó ${rows.length} planes automáticamente`,
      diff: { count: rows.length },
      actor_user_id: actor?.user?.id ?? null,
      actor_email: actor?.user?.email ?? null,
    });

    return NextResponse.json({ ok: true, created: (data || []).length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudieron crear actividades." }, { status: 500 });
  }
}

/** Borra muchos planes en una sola operación (más fiable que N DELETEs secuenciales). */
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    const rawIds = Array.isArray(body?.activityIds) ? body.activityIds : [];
    const activityIds = [...new Set(rawIds.map((id: unknown) => String(id).trim()).filter(Boolean))];

    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    if (!activityIds.length) return NextResponse.json({ error: "Faltan activityIds" }, { status: 400 });

    const gate = await requireTripAccessApi(String(tripId));
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManagePlan(gate.access, "No tienes permisos.");
    if (forbidden) return forbidden;

    const { access, supabase } = gate;
    const { data: actor } = await supabase.auth.getUser();

    const { data: rows, error: fetchErr } = await supabase
      .from("trip_activities")
      .select("*")
      .eq("trip_id", tripId)
      .in("id", activityIds);
    if (fetchErr) throw new Error(fetchErr.message);

    const found = rows || [];
    if (!found.length) {
      return NextResponse.json({ error: "No se encontraron planes para borrar." }, { status: 404 });
    }

    const skipped: Array<{ id: string; reason: string }> = [];
    const reservationIdsToDelete = new Set<string>();
    const directDeleteIds = new Set<string>();

    for (const row of found) {
      const id = String(row.id);
      const reservationId = linkedReservationId(row);

      if (reservationId && isLodgingActivityRow(row)) {
        if (!access.can_manage_resources) {
          skipped.push({
            id,
            reason: "Alojamiento vinculado a Docs: bórralo desde Docs o pide permiso de recursos.",
          });
          continue;
        }
        reservationIdsToDelete.add(reservationId);
      } else {
        directDeleteIds.add(id);
      }
    }

    let deleted = 0;

    for (const reservationId of reservationIdsToDelete) {
      const { error: delActErr } = await supabase
        .from("trip_activities")
        .delete()
        .eq("linked_reservation_id", reservationId);
      if (delActErr) throw new Error(delActErr.message);

      const { error: delResErr } = await supabase.from("trip_reservations").delete().eq("id", reservationId);
      if (delResErr) throw new Error(delResErr.message);
      deleted += 1;
    }

    const directIds = [...directDeleteIds];
    if (directIds.length) {
      const { data: removed, error: delErr } = await supabase
        .from("trip_activities")
        .delete()
        .eq("trip_id", tripId)
        .in("id", directIds)
        .select("id");
      if (delErr) throw new Error(delErr.message);
      deleted += (removed || []).length;
    }

    if (deleted > 0) {
      await safeInsertAudit(supabase, {
        trip_id: String(tripId),
        entity_type: "activity",
        entity_id: "bulk",
        action: "delete",
        summary: `Eliminó ${deleted} plan${deleted === 1 ? "" : "es"}`,
        diff: { count: deleted, skipped: skipped.length },
        actor_user_id: actor?.user?.id ?? null,
        actor_email: actor?.user?.email ?? null,
      });
    }

    if (deleted === 0 && skipped.length > 0) {
      return NextResponse.json(
        { error: skipped[0]?.reason || "No se pudo borrar ningún plan seleccionado." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      deleted,
      skipped: skipped.length,
      skippedDetails: skipped.length ? skipped : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudieron borrar los planes." },
      { status: 500 }
    );
  }
}
