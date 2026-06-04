import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
}

export async function POST(req: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const agencyId = typeof body?.agencyId === "string" ? body.agencyId : null;
  const leadId = typeof body?.leadId === "string" ? body.leadId : null;

  if (!text) return NextResponse.json({ error: "Escribe una nota." }, { status: 400 });
  if (!agencyId && !leadId) {
    return NextResponse.json({ error: "Falta agencyId o leadId." }, { status: 400 });
  }
  if (agencyId && leadId) {
    return NextResponse.json({ error: "Solo agencyId o leadId, no ambos." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("platform_crm_notes")
    .insert({
      agency_id: agencyId,
      lead_id: leadId,
      author_user_id: gate.user.id,
      body: text.slice(0, 4000),
    })
    .select("id, body, created_at")
    .maybeSingle();

  if (error) {
    if (error.message.includes("platform_crm_notes")) return migration();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}
