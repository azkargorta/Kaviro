import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isLeadStatus } from "@/lib/platform-ops/leads";

type Params = { params: { leadId: string } };

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (isLeadStatus(body?.status)) patch.status = body.status;
  if (body?.agencyId !== undefined) {
    patch.agency_id = body.agencyId === null || body.agencyId === "" ? null : body.agencyId;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("platform_agency_leads")
    .update(patch)
    .eq("id", params.leadId)
    .select("id, status, agency_id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });

  return NextResponse.json({ lead: data });
}
