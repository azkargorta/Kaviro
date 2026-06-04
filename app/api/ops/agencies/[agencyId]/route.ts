import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { getPlatformAgencyDetail } from "@/lib/server/platform-ops-data";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
type Params = { params: { agencyId: string } };

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  try {
    const detail = await getPlatformAgencyDetail(params.agencyId);
    if (!detail) return NextResponse.json({ error: "Agencia no encontrada." }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("platform_crm_notes")) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body?.plan === "string") patch.plan = body.plan;
  if (typeof body?.maxMembers === "number") patch.max_members = body.maxMembers;
  if (body?.contactEmail !== undefined) {
    patch.contact_email = body.contactEmail === "" ? null : String(body.contactEmail).trim();
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { error } = await admin.from("agencies").update(patch).eq("id", params.agencyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return GET(req, { params });
}
