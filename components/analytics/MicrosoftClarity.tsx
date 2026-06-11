"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readCookieConsent } from "@/components/legal/CookieConsentBanner";

const CLARITY_PROJECT_ID = "x59m1nudaj";

/**
 * Carga Microsoft Clarity únicamente cuando el usuario ha aceptado todas las cookies.
 * Se activa de forma reactiva al aceptar el banner de consentimiento sin necesidad
 * de recargar la página.
 */
export default function MicrosoftClarity() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (readCookieConsent() === "all") {
      setEnabled(true);
      return;
    }

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
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  );
}
