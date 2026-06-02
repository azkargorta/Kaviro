import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";

export const runtime = "nodejs";

type Params = { params: { clientId: string } };

async function getClientContext(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) return { error: NextResponse.json({ error: "Sin agencia." }, { status: 403 }) };

  const { data: client, error } = await supabase
    .from("agency_clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .maybeSingle();

  if (error || !client) {
    return { error: NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 }) };
  }

  if (client.agency_id !== ctx.agency.id) {
    return { error: NextResponse.json({ error: "Sin permiso." }, { status: 403 }) };
  }

  return { supabase, clientId };
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await getClientContext(params.clientId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, string | null> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    updates.name = name;
  }
  if (typeof body?.contact_email === "string") updates.contact_email = body.contact_email.trim() || null;
  if (typeof body?.contact_phone === "string") updates.contact_phone = body.contact_phone.trim() || null;
  if (typeof body?.notes === "string") updates.notes = body.notes.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await gate.supabase
    .from("agency_clients")
    .update(updates)
    .eq("id", params.clientId)
    .select("id, name, contact_email, contact_phone, notes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await getClientContext(params.clientId);
  if ("error" in gate) return gate.error;

  await gate.supabase
    .from("trips")
    .update({ agency_client_id: null })
    .eq("agency_client_id", params.clientId);

  const { error } = await gate.supabase.from("agency_clients").delete().eq("id", params.clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
