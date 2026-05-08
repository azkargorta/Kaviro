"use client";

import { useEffect } from "react";

export default function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    // En dev suele molestar; se puede forzar si quieres.
    if (process.env.NODE_ENV !== "production" && isLocalhost) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // no-op: no bloqueamos la app si el registro falla
    });
  }, []);

  return null;
}

