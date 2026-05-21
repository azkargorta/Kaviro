import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const CONFIRM_PHRASE = "ELIMINAR";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toUpperCase() : "";
    if (confirm !== CONFIRM_PHRASE) {
      return NextResponse.json({ error: `Confirma escribiendo ${CONFIRM_PHRASE}.` }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) return NextResponse.json({ error: userError.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const admin = createSupabaseAdmin();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo eliminar la cuenta." },
      { status: 500 }
    );
  }
}
