import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, agencyBrandingFromRow } from "@/lib/agency";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ ok: true, agency: null, membership: null });
    }

    return NextResponse.json({
      ok: true,
      agency: ctx.agency,
      membership: ctx.membership,
      branding: agencyBrandingFromRow(ctx.agency),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const missing =
      msg.toLowerCase().includes("agencies") ||
      msg.toLowerCase().includes("agency_members") ||
      msg.toLowerCase().includes("does not exist");
    return NextResponse.json(
      {
        ok: false,
        error: missing
          ? "Kaviro Trips no está configurado en la base de datos. Ejecuta docs/kaviro_agency_mode.sql."
          : msg,
        code: missing ? "AGENCY_SCHEMA_MISSING" : undefined,
      },
      { status: missing ? 503 : 500 }
    );
  }
}
