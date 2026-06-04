import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { opsOverviewCounts } from "@/lib/server/platform-ops-data";

export const runtime = "nodejs";

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_platform_ops.sql" });
}

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  try {
    const overview = await opsOverviewCounts();
    const { needsMigration, ...counts } = overview;
    return NextResponse.json({ counts, needsMigration: needsMigration || undefined });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("platform_agency_leads")) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
