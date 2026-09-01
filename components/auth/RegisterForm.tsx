"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resendSignupConfirmation, signUpWithEmail } from "@/lib/auth";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "@/lib/validators/auth";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidUsername(username.trim().toLowerCase())) {
      setError(
        "El nombre de usuario debe tener entre 3 y 20 caracteres y usar solo letras minúsculas, números o guion bajo"
      );
      return;
    }

    if (!isValidEmail(email)) {
      setError("Introduce un email válido");
      return;
    }

    if (!isValidPassword(password)) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!acceptedLegal) {
      setError("Debes aceptar los términos y la política de privacidad para crear la cuenta.");
      return;
    }

    try {
      setLoading(true);

      await signUpWithEmail({
        username,
        email,
        password,
      });

      const normalizedEmail = email.trim().toLowerCase();
      trackEvent(ANALYTICS_EVENTS.SIGN_UP_COMPLETED, { method: "email" });
      setSuccessEmail(normalizedEmail);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedLegal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!successEmail || resending) return;
    setResendMessage(null);
    try {
      setResending(true);
      await resendSignupConfirmation(successEmail);
      setResendMessage("Correo reenviado. Revisa también spam o correo no deseado.");
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "No se pudo reenviar el correo.");
    } finally {
      setResending(false);
    }
  }

  if (successEmail) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          <div className="text-2xl" aria-hidden>✉️</div>
          <h2 className="mt-2 text-lg font-extrabold">Revisa tu correo</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900/85 dark:text-emerald-200/85">
            Hemos enviado un enlace de confirmación a <strong>{successEmail}</strong>. Ábrelo para activar tu cuenta de Kaviro.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">¿Qué hago ahora?</p>
          <ol className="mt-2 space-y-1.5">
            <li>1. Abre el email de Kaviro.</li>
            <li>2. Pulsa el enlace para confirmar tu cuenta.</li>
            <li>3. Kaviro te llevará automáticamente a tu espacio.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Si no aparece, revisa también la carpeta de spam o correo no deseado.
          </p>
        </div>

        {resendMessage ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300">
            {resendMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="btn-press inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-100 dark:hover:bg-[#1E293B]"
        >
          {resending ? "Reenviando…" : "No me ha llegado · Reenviar correo"}
        </button>

        <Link
          href={loginHref}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-hover)]"
        >
          Ya la confirmé, ir al login →
        </Link>

        <button
          type="button"
          onClick={() => {
            setSuccessEmail(null);
            setResendMessage(null);
          }}
          className="w-full text-center text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="register-username"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Nombre de usuario
          </label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            placeholder="ej. unai_viajes"
            autoComplete="username"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Entre 3 y 20 caracteres: letras minúsculas, números o guion bajo.
          </p>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Contraseña
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Confirmar contraseña
          </label>
          <input
            id="register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            autoComplete="new-password"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300">
          <input
            type="checkbox"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand-border)]"
          />
          <span>
            Acepto los{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-[var(--brand)] hover:underline">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-[var(--brand)] hover:underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !acceptedLegal}
          className="btn-press w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        ¿Ya tienes cuenta?{" "}
        <Link href={loginHref} className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
