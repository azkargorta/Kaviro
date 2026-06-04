import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { DEFAULT_PRE_DEPARTURE_CHECKLIST } from "@/lib/agency/checklist-defaults";

type Params = { params: { tripId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data, error } = await gate.supabase
    .from("agency_trip_checklist_items")
    .select("id, label, sort_order, is_checked, checked_at")
    .eq("trip_id", params.tripId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.includes("agency_trip_checklist")) {
      return NextResponse.json({ items: [], needsMigration: true, migration: "kaviro_agency_checklist.sql" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data ?? [];
  if (items.length) {
    const done = items.filter((i) => i.is_checked).length;
    return NextResponse.json({ items, progress: { done, total: items.length } });
  }

  return NextResponse.json({ items: [], progress: { done: 0, total: 0 }, empty: true });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const useDefaults = body?.seedDefaults === true;

  const { count } = await gate.supabase
    .from("agency_trip_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", params.tripId);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "El checklist ya existe." }, { status: 409 });
  }

  const labels: string[] = useDefaults
    ? [...DEFAULT_PRE_DEPARTURE_CHECKLIST]
    : Array.isArray(body?.labels)
      ? body.labels.map((l: unknown) => String(l).trim()).filter(Boolean)
      : [...DEFAULT_PRE_DEPARTURE_CHECKLIST];

  if (!labels.length) {
    return NextResponse.json({ error: "Sin ítems." }, { status: 400 });
  }

  const rows = labels.map((label, i) => ({
    agency_id: gate.ctx.agency.id,
    trip_id: params.tripId,
    label,
    sort_order: i,
  }));

  const { data, error } = await gate.supabase
    .from("agency_trip_checklist_items")
    .insert(rows)
    .select("id, label, sort_order, is_checked, checked_at");

  if (error) {
    if (error.message.includes("agency_trip_checklist")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_checklist.sql" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [], progress: { done: 0, total: rows.length } }, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  if (!itemId) return NextResponse.json({ error: "Falta itemId." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body?.isChecked === "boolean") {
    patch.is_checked = body.isChecked;
    patch.checked_at = body.isChecked ? new Date().toISOString() : null;
    patch.checked_by = body.isChecked ? gate.user.id : null;
  }
  if (typeof body?.label === "string" && body.label.trim()) {
    patch.label = body.label.trim();
  }

  const { data, error } = await gate.supabase
    .from("agency_trip_checklist_items")
    .update(patch)
    .eq("id", itemId)
    .eq("trip_id", params.tripId)
    .select("id, label, sort_order, is_checked, checked_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Ítem no encontrado." }, { status: 404 });

  const { data: all } = await gate.supabase
    .from("agency_trip_checklist_items")
    .select("is_checked")
    .eq("trip_id", params.tripId);

  const items = all ?? [];
  const done = items.filter((i) => i.is_checked).length;

  return NextResponse.json({ item: data, progress: { done, total: items.length } });
}
