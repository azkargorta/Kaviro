import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { agencyBrandingFromRow, getAgencyForUser } from "@/lib/agency";
import {
  AGENCY_LOGO_BUCKET,
  AGENCY_LOGO_MAX_BYTES,
  AGENCY_LOGO_MIME_TYPES,
  agencyLogoStoragePath,
  canManageAgencyBranding,
} from "@/lib/agency-branding";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
      return NextResponse.json({ error: "Solo administradores pueden subir el logo." }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo de imagen." }, { status: 400 });
    }

    if (!AGENCY_LOGO_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no válido. Usa PNG, JPG, WebP o SVG." },
        { status: 400 }
      );
    }

    if (file.size > AGENCY_LOGO_MAX_BYTES) {
      return NextResponse.json({ error: "El logo no puede superar 2 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = agencyLogoStoragePath(ctx.agency.id, file.type);

    const { error: uploadError } = await supabase.storage
      .from(AGENCY_LOGO_BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      const hint = uploadError.message.toLowerCase().includes("bucket")
        ? " Ejecuta docs/kaviro_agency_logos_storage.sql en Supabase."
        : "";
      return NextResponse.json(
        { error: `No se pudo subir el logo.${hint}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabase.storage.from(AGENCY_LOGO_BUCKET).getPublicUrl(storagePath);
    const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

    const { data: agency, error: updateError } = await supabase
      .from("agencies")
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq("id", ctx.agency.id)
      .select(
        "id, name, slug, logo_url, brand_color, contact_email, owner_id, plan, max_members"
      )
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      logoUrl,
      agency,
      branding: agencyBrandingFromRow(agency),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
