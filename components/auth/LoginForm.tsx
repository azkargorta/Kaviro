"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithEmail } from "@/lib/auth";
import KaviroLoadingScreen from "@/components/brand/KaviroLoadingScreen";
import { AGENCY_PARTNERSHIP_EMAIL, KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { defaultLoginNext, parseWorkspaceModeParam, WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode";

function welcomeLabel(username: string | null, email: string) {
  if (username) return `@${username}`;
  const local = email.split("@")[0]?.trim();
  return local || "viajero";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseWorkspaceModeParam(searchParams.get("mode"));
  const next = searchParams.get("next") || defaultLoginNext(mode);
  const isAgencyLogin = mode === "agency";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  useEffect(() => {
    // PKCE: Supabase suele redirigir con ?code= y a menudo sin type= en la query.
    // Si cae en /auth/login, intercambiamos el código y vamos a reset.
    const code = searchParams.get("code");
    if (code) {
      const q = new URLSearchParams({
        code,
        next: "/auth/reset-password",
        type: "recovery",
      });
      router.replace(`/auth/callback?${q.toString()}`);
      router.refresh();
      return;
    }

    // Implicit: tokens en el hash solo si es flujo recovery (evita confundir con otros magic links).
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const qs = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const type = (qs.get("type") || "").toLowerCase();
    if (type === "recovery") {
      router.replace(`/auth/reset-password${hash}`);
      router.refresh();
    }
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await signInWithEmail({ email, password });

      const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      const me = (await meRes.json().catch(() => null)) as {
        username?: string | null;
        email?: string | null;
      } | null;
      const label = welcomeLabel(me?.username ?? null, me?.email || email);
      setWelcomeName(label);

      const agRes = await fetch("/api/agencies/me", { credentials: "include", cache: "no-store" });
      const ag = (await agRes.json().catch(() => null)) as { agency?: { id?: string } | null } | null;
      const hasAgency = Boolean(ag?.agency?.id);

      let dest =
        next.startsWith("/") && !next.startsWith("//") ? next : defaultLoginNext(mode);

      const wantsAgencyPanel =
        dest === "/agency" ||
        (dest.startsWith("/agency/") && !dest.startsWith("/agency/join"));

      if (hasAgency) {
        const honorNext =
          next.startsWith("/agency/join") ||
          next.startsWith("/trip/") ||
          next.startsWith("/client/");
        dest = honorNext ? next : "/agency";
        try {
          localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "agency");
        } catch {
          /* */
        }
      } else if (isAgencyLogin || wantsAgencyPanel) {
        dest = "/empresa?reason=no-membership";
        try {
          localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "personal");
        } catch {
          /* */
        }
      } else {
        try {
          localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "personal");
        } catch {
          /* */
        }
      }

      window.setTimeout(() => {
        window.location.assign(dest);
      }, 1800);
    } catch (err) {
      setWelcomeName(null);
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setLoading(false);
    }
  }

  if (welcomeName) {
    return (
      <KaviroLoadingScreen
        fixed
        brand={isAgencyLogin ? "navy" : "coral"}
        subtitle={
          isAgencyLogin
            ? `Entrando al panel, ${welcomeName}…`
            : `¡Vamos a viajar, ${welcomeName}!`
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {isAgencyLogin ? (
        <p className="rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-4 py-3 text-sm text-slate-600 dark:border-sky-900/40 dark:bg-[#1e3a5f]/10 dark:text-slate-300">
          Acceso al panel solo para cuentas autorizadas. Si aún no tienes acceso, escribe a{" "}
          <a href={`mailto:${AGENCY_PARTNERSHIP_EMAIL}`} className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            {AGENCY_PARTNERSHIP_EMAIL}
          </a>
          .
        </p>
      ) : null}

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-[#0F1623] px-4 py-3 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)]"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Contraseña
          </label>
<div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm shadow-sm transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#0F1623]"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:text-slate-300 transition"
              aria-label={showPassword ? "Ocultar caracteres escritos" : "Mostrar caracteres escritos"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
        >
          {loading ? "Entrando..." : isAgencyLogin ? `Entrar a ${KAVIRO_TRIPS_PRODUCT_NAME}` : "Iniciar sesión"}
        </button>
      </form>

      {/* LINKS */}
      <div className="flex flex-col gap-2 text-sm text-slate-600">
        {isAgencyLogin ? (
          <Link href="/auth/login" className="text-center text-slate-500 hover:text-slate-700 dark:text-slate-300">
            Acceso como viajero (modo personal)
          </Link>
        ) : (
          <Link
            href="/empresa"
            className="text-center font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300"
          >
            ¿Usas {KAVIRO_TRIPS_PRODUCT_NAME}? Entra aquí
          </Link>
        )}
        <Link
          href="/auth/forgot-password"
          className="text-center text-slate-500 hover:text-slate-700 dark:text-slate-300"
        >
          ¿Olvidaste tu contraseña?
        </Link>

        {!isAgencyLogin ? (
          <Link
            href="/auth/register"
            className="text-center font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
          >
            Crear cuenta
          </Link>
        ) : null}
      </div>
    </div>
  );
}
