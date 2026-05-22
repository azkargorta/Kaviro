"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signUpWithEmail } from "@/lib/auth";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "@/lib/validators/auth";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

      setSuccess("Cuenta creada. Revisa tu email para confirmar la cuenta antes de entrar.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre de usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            placeholder="nombre de usuario"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar contraseña</label>
          <input
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
          className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
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