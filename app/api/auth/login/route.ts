import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/validators/auth";
import { goTruePasswordGrant } from "@/lib/supabase/goTruePasswordGrant";

export const runtime = "nodejs";
export const maxDuration = 30;

type CookieRow = { name: string; value: string; options: CookieOptions };

/**
 * Login email/contraseña en servidor y cookies en la respuesta.
 * GoTrue REST + setSession (más fiable en Vercel que signInWithPassword del SDK).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const email =
    typeof (body as { email?: string })?.email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  const password =
    typeof (body as { password?: string })?.password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Autenticación no configurada en el servidor. Contacta con soporte." },
      { status: 503 }
    );
  }

  const grant = await goTruePasswordGrant(supabaseUrl, supabaseAnonKey, email, password);
  if (!grant.ok) {
    const status = grant.status === 504 ? 504 : grant.status === 401 || grant.status === 400 ? 401 : 502;
    return NextResponse.json({ error: grant.message }, { status });
  }

  const cookieStore = await cookies();
  const cookieWrites: CookieRow[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        cookieWrites.push(...toSet);
      },
    },
  });

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: grant.access_token,
    refresh_token: grant.refresh_token,
  });

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  for (const { name, value, options } of cookieWrites) {
    res.cookies.set(name, value, options);
  }
  return res;
}
