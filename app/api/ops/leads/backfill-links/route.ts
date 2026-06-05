import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { backfillPlatformLeadLinks } from "@/lib/server/link-agency-lead";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  try {
    const admin = createSupabaseAdmin();
    const result = await backfillPlatformLeadLinks(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("platform_agency_leads")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
