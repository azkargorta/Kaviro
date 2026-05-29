import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { forbidUnlessCanManageResources, requireTripAccessApi } from "@/lib/trip-access-api";
import {
  canViewTripResource,
  normalizeResourceVisibility,
  parseVisibleUserIds,
} from "@/lib/trip-resources/visibility";

const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;

async function loadTripParticipantUserIds(supabase: SupabaseClient, tripId: string) {
  const { data, error } = await supabase
    .from("trip_participants")
    .select("user_id, role")
    .eq("trip_id", tripId)
    .neq("status", "removed");

  if (error) throw new Error(error.message);

  const rows = data || [];
  const userIds = rows.map((row) => row.user_id).filter((id): id is string => typeof id === "string");
  const ownerUserId = rows.find((row) => row.role === "owner")?.user_id ?? null;
  return { userIds: new Set(userIds), ownerUserId };
}

async function attachSignedFileUrls(supabase: SupabaseClient, resources: Record<string, unknown>[]) {
  return Promise.all(
    resources.map(async (resource) => {
      const filePath = typeof resource.file_path === "string" ? resource.file_path : null;
      if (!filePath) return resource;

      const { data, error } = await supabase.storage
        .from("trip-documents")
        .createSignedUrl(filePath, SIGNED_URL_TTL_SEC);

      if (error || !data?.signedUrl) return resource;
      return { ...resource, file_url: data.signedUrl };
    })
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const { ownerUserId } = await loadTripParticipantUserIds(gate.supabase, tripId);

    const [{ data: resources, error: resourcesError }, { data: reservations, error: reservationsError }] =
      await Promise.all([
        gate.supabase
          .from("trip_resources")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: false }),
        gate.supabase
          .from("trip_reservations")
          .select("*")
          .eq("trip_id", tripId)
          .order("check_in_date", { ascending: true }),
      ]);

    if (resourcesError) throw new Error(resourcesError.message);
    if (reservationsError) throw new Error(reservationsError.message);

    const visibleResources = (resources || []).filter((row) =>
      canViewTripResource(row, gate.access.userId, { tripOwnerUserId: ownerUserId })
    );

    const resourcesWithUrls = await attachSignedFileUrls(
      gate.supabase,
      visibleResources as Record<string, unknown>[]
    );

    return NextResponse.json({ resources: resourcesWithUrls, reservations: reservations || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar recursos y reservas." },
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
    const forbidden = forbidUnlessCanManageResources(gate.access, "No tienes permisos para crear recursos.");
    if (forbidden) return forbidden;

    const visibility = normalizeResourceVisibility(body?.visibility);
    let visibleToUserIds = parseVisibleUserIds(body?.visible_to_user_ids);

    const { userIds: participantUserIds } = await loadTripParticipantUserIds(gate.supabase, tripId);

    if (visibility === "selected") {
      visibleToUserIds = visibleToUserIds.filter((id) => participantUserIds.has(id));
      if (visibleToUserIds.length === 0) {
        return NextResponse.json(
          { error: "Selecciona al menos un viajero que pueda ver este documento." },
          { status: 400 }
        );
      }
    } else {
      visibleToUserIds = [];
    }

    const { access, supabase } = gate;
    const payload: Record<string, unknown> = {
      trip_id: tripId,
      title: typeof body?.title === "string" ? body.title.trim() : null,
      resource_type: typeof body?.resource_type === "string" ? body.resource_type : "document",
      category: typeof body?.category === "string" ? body.category : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
      file_path: typeof body?.file_path === "string" ? body.file_path : null,
      file_url: typeof body?.file_url === "string" ? body.file_url : null,
      mime_type: typeof body?.mime_type === "string" ? body.mime_type : null,
      detected_document_type: typeof body?.detected_document_type === "string" ? body.detected_document_type : null,
      detected_data: body?.detected_data ?? {},
      linked_reservation_id: typeof body?.linked_reservation_id === "string" ? body.linked_reservation_id : null,
      created_by_user_id: access.userId,
      visibility,
      visible_to_user_ids: visibleToUserIds,
    };

    if (!payload.title) return NextResponse.json({ error: "Falta title" }, { status: 400 });

    const { data, error } = await supabase.from("trip_resources").insert(payload).select("*").single();
    if (error) {
      const needsMigration =
        error.message?.includes("visibility") || error.message?.includes("visible_to_user_ids");
      if (needsMigration) {
        return NextResponse.json(
          {
            error:
              "Falta la migración de visibilidad en la base de datos. Ejecuta docs/tripboard_resources_visibility.sql en Supabase.",
          },
          { status: 500 }
        );
      }
      throw new Error(error.message);
    }

    const [resource] = await attachSignedFileUrls(supabase, [data as Record<string, unknown>]);

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el recurso." },
      { status: 500 }
    );
  }
}
