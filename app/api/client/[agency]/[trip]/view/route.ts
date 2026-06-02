import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { loadAgencyClientPortal } from "@/lib/load-agency-client-portal";

export const runtime = "nodejs";

type Params = { params: { agency: string; trip: string } };

export async function POST(req: Request, { params }: Params) {
  const data = await loadAgencyClientPortal(params.agency, params.trip);
  if (!data) {
    return NextResponse.json({ error: "Portal no disponible." }, { status: 404 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";
  const viewerHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("agency_portal_views").insert({
    agency_id: data.agency.id,
    trip_id: data.trip.id,
    viewer_hash: viewerHash,
  });

  if (error && !error.message.includes("agency_portal_views")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
