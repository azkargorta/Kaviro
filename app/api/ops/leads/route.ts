import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { listPlatformLeads } from "@/lib/server/platform-ops-data";
import { LEAD_STATUSES } from "@/lib/platform-ops/leads";

export const runtime = "nodejs";

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
}

export async function GET(req: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const status = new URL(req.url).searchParams.get("status") ?? "all";

  try {
    const leads = await listPlatformLeads(status);
    return NextResponse.json({ leads, statuses: LEAD_STATUSES });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("platform_agency_leads")) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
