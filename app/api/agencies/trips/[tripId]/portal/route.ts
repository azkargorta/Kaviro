import { NextResponse } from "next/server";
import {
  getAgencyPortalMeta,
  publishAgencyPortal,
  unpublishAgencyPortal,
  ensureAgencyPortalRow,
} from "@/lib/agency-portal";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { slugifyForUrl } from "@/lib/agency-slug";

export const runtime = "nodejs";

type Params = { params: { tripId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const slug =
    (gate.trip.client_portal_slug as string | null) ||
    slugifyForUrl((gate.trip.name as string) || "viaje");

  let meta = await getAgencyPortalMeta(gate.supabase, params.tripId);
  if (!meta && slug) {
    await ensureAgencyPortalRow(gate.supabase, params.tripId, gate.ctx.agency.id, slug);
    meta = await getAgencyPortalMeta(gate.supabase, params.tripId);
  }

  return NextResponse.json({
    portal: meta,
    agencySlug: gate.ctx.agency.slug,
    clientPortalSlug: slug,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;

  const slug =
    (gate.trip.client_portal_slug as string | null) ||
    slugifyForUrl((gate.trip.name as string) || "viaje");

  await ensureAgencyPortalRow(gate.supabase, params.tripId, gate.ctx.agency.id, slug);

  if (action === "publish") {
    const publishedAt = await publishAgencyPortal(gate.supabase, params.tripId);
    return NextResponse.json({ ok: true, isActive: true, lastPublishedAt: publishedAt });
  }

  if (action === "unpublish") {
    await unpublishAgencyPortal(gate.supabase, params.tripId);
    return NextResponse.json({ ok: true, isActive: false });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
