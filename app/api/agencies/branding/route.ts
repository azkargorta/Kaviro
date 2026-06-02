import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  agencyBrandingFromRow,
  getAgencyForUser,
} from "@/lib/agency";
import {
  canManageAgencyBranding,
  normalizeAgencyContactEmail,
  normalizeBrandColor,
} from "@/lib/agency-branding";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ error: "Sin agencia." }, { status: 403 });
    }

    return NextResponse.json({
      agency: ctx.agency,
      branding: agencyBrandingFromRow(ctx.agency),
      canEdit: canManageAgencyBranding(ctx.agency, ctx.membership, user.id),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ error: "Sin agencia." }, { status: 403 });
    }

    if (!canManageAgencyBranding(ctx.agency, ctx.membership, user.id)) {
      return NextResponse.json({ error: "Solo administradores pueden editar el branding." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const updates: Record<string, string | null> = {};

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "El nombre de la agencia no puede estar vacío." }, { status: 400 });
      }
      updates.name = name;
    }

    if (body?.brand_color !== undefined) {
      const color = normalizeBrandColor(
        typeof body.brand_color === "string" ? body.brand_color : null
      );
      if (body.brand_color && !color) {
        return NextResponse.json(
          { error: "Color inválido. Usa formato hexadecimal (#1e3a5f)." },
          { status: 400 }
        );
      }
      updates.brand_color = color ?? "#1e3a5f";
    }

    if (body?.contact_email !== undefined) {
      const email = normalizeAgencyContactEmail(
        typeof body.contact_email === "string" ? body.contact_email : null
      );
      if (body.contact_email && !email) {
        return NextResponse.json({ error: "Email de contacto inválido." }, { status: 400 });
      }
      updates.contact_email = email;
    }

    if (body?.clear_logo === true) {
      updates.logo_url = null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: agency, error } = await supabase
      .from("agencies")
      .update(updates)
      .eq("id", ctx.agency.id)
      .select(
        "id, name, slug, logo_url, brand_color, contact_email, owner_id, plan, max_members"
      )
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      agency,
      branding: agencyBrandingFromRow(agency),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
