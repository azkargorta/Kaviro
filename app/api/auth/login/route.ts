import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/validators/auth";
import { withTimeout } from "@/lib/with-timeout";

export const runtime = "nodejs";
export const maxDuration = 30;

type CookieRow = { name: string; value: string; options: CookieOptions };

/**
 * Login email/contraseña en servidor y cookies en la respuesta.
 * Evita signInWithPassword en el cliente, que a veces no termina (mismo problema que getSession).
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
    }
  );

  const AUTH_TIMEOUT_MS = 18_000;
  const AUTH_TIMEOUT_MSG = "AUTH_TIMEOUT";

  let error: { message: string } | null = null;
  try {
    const result = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_MSG
    );
    error = result.error;
  } catch (e) {
    if (e instanceof Error && e.message === AUTH_TIMEOUT_MSG) {
      return NextResponse.json(
        {
          error:
            "No se pudo contactar con el servicio de autenticación. Comprueba tu conexión e inténtalo de nuevo.",
        },
        { status: 504 }
      );
    }
    throw e;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  for (const { name, value, options } of cookieWrites) {
    res.cookies.set(name, value, options);
  }
  return res;
}
