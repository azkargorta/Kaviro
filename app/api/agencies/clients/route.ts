import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

    const { data, error } = await supabase
      .from("agency_clients")
      .select("id, name, contact_email, contact_phone, notes, created_at")
      .eq("agency_id", ctx.agency.id)
      .order("name", { ascending: true });

    if (error) {
      if (error.message.includes("agency_clients")) {
        return NextResponse.json({ clients: [], needsMigration: true });
      }
      throw new Error(error.message);
    }

    const clients = data ?? [];
    const clientIds = clients.map((c) => c.id as string);

    const tripCountByClient: Record<string, number> = {};
    if (clientIds.length > 0) {
      const { data: tripRows } = await supabase
        .from("trips")
        .select("agency_client_id")
        .eq("agency_id", ctx.agency.id)
        .in("agency_client_id", clientIds);

      for (const row of tripRows ?? []) {
        const cid = row.agency_client_id as string;
        if (cid) tripCountByClient[cid] = (tripCountByClient[cid] ?? 0) + 1;
      }
    }

    return NextResponse.json({
      clients: clients.map((c) => ({
        ...c,
        tripCount: tripCountByClient[c.id as string] ?? 0,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

    const { data, error } = await supabase
      .from("agency_clients")
      .insert({
        agency_id: ctx.agency.id,
        name,
        contact_email: typeof body?.contact_email === "string" ? body.contact_email.trim() || null : null,
        contact_phone: typeof body?.contact_phone === "string" ? body.contact_phone.trim() || null : null,
        notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
      })
      .select("id, name, contact_email, contact_phone, notes, created_at")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ client: data }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
