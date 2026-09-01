import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { createRecoveryEmailClient } from "@/lib/supabase/recovery-email-client";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
} from "@/lib/validators/auth";
import { isUsernameAvailable } from "@/lib/profile";
import { clearSupabaseBrowserCookies } from "@/lib/clear-supabase-browser-cookies";
import { withTimeout } from "@/lib/with-timeout";

function friendlyLoginError(message: string) {
  if (/email.*not.*confirmed|email_not_confirmed/i.test(message)) {
    return "Todavía falta confirmar tu email. Abre el enlace que te enviamos al registrarte o solicita uno nuevo.";
  }
  if (/invalid login credentials|invalid.*credentials/i.test(message)) {
    return "Email o contraseña incorrectos.";
  }
  return message;
}

function safeAuthNext(next?: string | null) {
  if (!next) return null;
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function confirmationRedirect(next?: string | null) {
  const url = new URL("/auth/callback", window.location.origin);
  const safeNext = safeAuthNext(next);
  if (safeNext) url.searchParams.set("next", safeNext);
  return url.toString();
}

/**
 * Registro con email + password
 */
export async function signUpWithEmail(params: {
  username: string;
  email: string;
  password: string;
  next?: string | null;
}) {
  const username = normalizeUsername(params.username);
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!isValidUsername(username)) {
    throw new Error(
      "El nombre de usuario debe tener entre 3 y 20 caracteres y usar solo letras minúsculas, números o guion bajo"
    );
  }

  if (!isValidEmail(email)) {
    throw new Error("Email no válido");
  }

  if (!isValidPassword(password)) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }

  const available = await withTimeout(
    isUsernameAvailable(username),
    12_000,
    "El servidor tardó demasiado en comprobar el nombre de usuario. Reintenta."
  );
  if (!available) {
    throw new Error("Ese nombre de usuario ya está en uso");
  }

  const redirectTo = confirmationRedirect(params.next);

  // Registro robusto: hacemos signup server-side para evitar problemas de SMTP/timeouts en cliente.
  const resp = await withTimeout(
    fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password, redirectTo }),
    }),
    20_000,
    "El servidor tardó demasiado en crear tu cuenta. Reintenta."
  );

  const payload = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg = payload?.error ? String(payload.error) : `Error ${resp.status}`;
    throw new Error(msg);
  }

  // Con confirmación de email activa, la sesión llegará al abrir el enlace del correo.
  return payload;
}

/** Reenvía el correo de confirmación de una cuenta recién creada. */
export async function resendSignupConfirmation(emailRaw: string, next?: string | null) {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error("Introduce un email válido.");

  const client = createClient();
  const redirectTo = confirmationRedirect(next);
  const { error } = await withTimeout(
    client.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    }),
    20_000,
    "El servidor tardó demasiado en reenviar el correo. Reintenta."
  );

  if (error) throw new Error(error.message);
}

/**
 * Login con email + password
 */
export async function signInWithEmail(params: {
  email: string;
  password: string;
}) {
  const email = params.email.trim().toLowerCase();

  const res = await withTimeout(
    fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: params.password }),
    }),
    25_000,
    "El servidor tardó demasiado. Reintenta."
  );

  const payload = (await res.json().catch(() => null)) as { error?: string } | null;

  // Si Vercel no alcanza Supabase, el navegador a veces sí (red distinta).
  if (res.status === 502 || res.status === 504) {
    const client = createClient();
    const { error } = await withTimeout(
      client.auth.signInWithPassword({ email, password: params.password }),
      20_000,
      "El servidor tardó demasiado. Reintenta."
    );
    if (error) throw new Error(friendlyLoginError(error.message));
    return { ok: true };
  }

  if (!res.ok) {
    throw new Error(friendlyLoginError(payload?.error || `Error ${res.status}`));
  }

  return payload;
}

/**
 * Enviar email de recuperación de contraseña
 */
export async function sendPasswordReset(email: string) {
  // Punto de entrada dedicado: normaliza ?code= → callback y #hash → reset-password.
  // Debe figurar en Supabase → Authentication → URL Configuration → Redirect URLs.
  const redirectTo = `${window.location.origin}/auth/recovery`;

  const recoveryClient = createRecoveryEmailClient();
  const { error } = await recoveryClient.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo,
    }
  );

  if (error) throw error;
}

/**
 * Actualizar contraseña
 */
export async function updateMyPassword(newPassword: string) {
  if (!isValidPassword(newPassword)) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
  }

  const client = createClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) {
    throw new Error(
      "No hay sesión de recuperación en este navegador. Abre de nuevo el enlace del correo (misma pestaña tras el clic)."
    );
  }

  const { error } = await withTimeout(
    client.auth.updateUser({ password: newPassword }),
    25_000,
    "El servidor tardó demasiado. Comprueba la conexión e inténtalo otra vez."
  );

  if (error) throw error;
}

/**
 * Logout (simple y limpio)
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error en signOut:", error);
    throw error;
  }
}
