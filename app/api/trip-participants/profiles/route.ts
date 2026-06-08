import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get("query") || "").trim();
    const query = raw.replace(/^@+/, "").toLowerCase();
    if (!query || query.length < 2) {
      return NextResponse.json({ profiles: [], hint: query.length < 2 ? "min_length" : null });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const pattern = `%${query}%`;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, full_name")
      .or(`username.ilike.${pattern},email.ilike.${pattern},full_name.ilike.${pattern}`)
      .neq("id", user.id)
      .limit(8);

    if (error) throw new Error(error.message);

    return NextResponse.json({ profiles: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron buscar perfiles." },
      { status: 500 }
    );
  }
}

