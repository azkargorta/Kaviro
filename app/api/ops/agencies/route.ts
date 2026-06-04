import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { listPlatformAgencies } from "@/lib/server/platform-ops-data";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  try {
    const agencies = await listPlatformAgencies();
    return NextResponse.json({ agencies });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
