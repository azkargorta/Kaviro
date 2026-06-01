import { NextResponse } from "next/server";
import { normalizePermissions, type TripRole } from "@/lib/participants";
import { requireTripAccessApi, forbidUnlessCanManageParticipants } from "@/lib/trip-access-api";

export const runtime = "nodejs";

const MAX_BULK = 80;

type BulkRow = {
  display_name: string;
  email?: string | null;
  phone?: string | null;
  role?: TripRole;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
    const rows = Array.isArray(body?.participants) ? (body.participants as BulkRow[]) : [];
    const defaultRole = (typeof body?.role === "string" ? body.role : "viewer") as TripRole;

    if (!tripId) {
      return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    }
    if (!rows.length) {
      return NextResponse.json({ error: "No hay participantes para importar." }, { status: 400 });
    }
    if (rows.length > MAX_BULK) {
      return NextResponse.json(
        { error: `Máximo ${MAX_BULK} participantes por importación.` },
        { status: 400 }
      );
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const denied = forbidUnlessCanManageParticipants(gate.access);
    if (denied) return denied;

    const { supabase } = gate;

    const { data: existingRows, error: existingErr } = await supabase
      .from("trip_participants")
      .select("id, display_name, email")
      .eq("trip_id", tripId)
      .neq("status", "removed");

    if (existingErr) throw new Error(existingErr.message);

    const existingEmails = new Set(
      (existingRows ?? [])
        .map((r) => (r.email ? String(r.email).toLowerCase() : ""))
        .filter(Boolean)
    );
    const existingNames = new Set(
      (existingRows ?? []).map((r) => String(r.display_name || "").trim().toLowerCase()).filter(Boolean)
    );

    const permissions = normalizePermissions(defaultRole, {});
    let created = 0;
    let skipped = 0;
    const errors: Array<{ display_name: string; error: string }> = [];
    const batchSeen = new Set<string>();

    for (const row of rows) {
      const display_name =
        typeof row.display_name === "string" ? row.display_name.trim() : "";
      if (!display_name || display_name.length < 2) {
        skipped += 1;
        continue;
      }

      const email =
        typeof row.email === "string" && row.email.trim()
          ? row.email.trim().toLowerCase()
          : null;
      const phone = typeof row.phone === "string" && row.phone.trim() ? row.phone.trim() : null;
      const role = (typeof row.role === "string" ? row.role : defaultRole) as TripRole;
      const dedupeKey = email ?? display_name.toLowerCase();

      if (batchSeen.has(dedupeKey)) {
        skipped += 1;
        continue;
      }
      batchSeen.add(dedupeKey);

      if (email && existingEmails.has(email)) {
        skipped += 1;
        continue;
      }
      if (!email && existingNames.has(display_name.toLowerCase())) {
        skipped += 1;
        continue;
      }

      const rowPermissions = normalizePermissions(role, {});

      const { error: insertErr } = await supabase.from("trip_participants").insert({
        trip_id: tripId,
        display_name,
        email,
        phone,
        username: null,
        joined_via: "bulk_import",
        user_id: null,
        role,
        status: "pending",
        linked_at: null,
        ...rowPermissions,
      });

      if (insertErr) {
        errors.push({
          display_name,
          error: insertErr.message,
        });
        continue;
      }

      created += 1;
      if (email) existingEmails.add(email);
      existingNames.add(display_name.toLowerCase());
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo importar la lista de participantes.",
      },
      { status: 500 }
    );
  }
}
