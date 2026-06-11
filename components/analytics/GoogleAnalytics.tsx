"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readCookieConsent } from "@/components/legal/CookieConsentBanner";

const GA_ID = "G-9KXPVJDKF1";

/**
 * Carga Google Analytics 4 únicamente cuando el usuario ha aceptado todas las cookies.
 * Se activa de forma reactiva al aceptar el banner de consentimiento sin necesidad
 * de recargar la página.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Si el consentimiento ya fue dado en una sesión previa, activar inmediatamente.
    if (readCookieConsent() === "all") {
      setEnabled(true);
      return;
    }

    // Escuchar la aceptación en tiempo real desde el banner de cookies.
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ choice: string }>).detail?.choice === "all") {
        setEnabled(true);
      }
    };
    window.addEventListener("kaviro:cookie-consent", handler);
    return () => window.removeEventListener("kaviro:cookie-consent", handler);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
