import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardHeaderMeta } from "@/lib/dashboard-header-meta";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const meta = await getDashboardHeaderMeta(supabase, user.id);
  return NextResponse.json(meta);
}
