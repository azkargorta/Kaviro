"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STORAGE_KEY_PREFIX } from "@/lib/brand";

const CONSENT_KEY = `${STORAGE_KEY_PREFIX}_cookie_consent`;

export type CookieConsent = "essential" | "all";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readCookieConsent()) setVisible(true);
  }, []);

  function save(choice: CookieConsent) {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      /* private mode */
    }
    setVisible(false);
    if (choice === "all") {
      window.dispatchEvent(new CustomEvent("kaviro:cookie-consent", { detail: { choice: "all" } }));
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-[#334155] dark:bg-[#0F1623]/95 sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Usamos cookies esenciales para la sesión y, si lo aceptas, cookies de medición para mejorar Kaviro. Más info en{" "}
          <Link href="/privacy" className="font-semibold text-[var(--brand)] hover:underline">
            privacidad
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save("essential")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200"
          >
            Solo esenciales
          </button>
          <button
            type="button"
            onClick={() => save("all")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
