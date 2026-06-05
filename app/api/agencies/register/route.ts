import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AgencyRegisterError, registerAgencyForUser } from "@/lib/server/agency-register";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Inicia sesión para crear tu agencia." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name : "";
    const slug = typeof body?.slug === "string" ? body.slug : undefined;
    const contactEmail =
      typeof body?.contactEmail === "string"
        ? body.contactEmail
        : user.email || undefined;

    const agency = await registerAgencyForUser(supabase, user.id, {
      name,
      slug,
      contactEmail,
    });

    return NextResponse.json({ ok: true, agency });
  } catch (error) {
    if (error instanceof AgencyRegisterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("POST /api/agencies/register:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la agencia." },
      { status: 500 }
    );
  }
}
