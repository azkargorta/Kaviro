import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";

/** APIs y páginas de Kaviro Ops — solo `platform_admins` o `KAVIRO_ADMIN_EMAILS`. */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  }

  if (!(await isPlatformAdmin(user.id, user.email))) {
    return {
      error: NextResponse.json(
        { error: "Sin permisos. Esta zona es solo para administradores de plataforma." },
        { status: 403 }
      ),
    };
  }

  return { supabase, user };
}
