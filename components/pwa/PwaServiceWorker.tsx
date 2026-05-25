"use client";

import { useEffect, useRef } from "react";
import { resyncPushIfPreferencesEnabled } from "@/lib/push-subscribe-client";

export default function PwaServiceWorker() {
  const resyncingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    if (process.env.NODE_ENV !== "production" && isLocalhost) return;

    let cancelled = false;

    async function runResync() {
      if (cancelled || resyncingRef.current) return;
      resyncingRef.current = true;
      try {
        await resyncPushIfPreferencesEnabled();
      } finally {
        resyncingRef.current = false;
      }
    }

    async function setup() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        if (cancelled) return;
        await runResync();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") void runResync();
          });
        });
      } catch {
        /* non-blocking */
      }
    }

    const onControllerChange = () => {
      void runResync();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void runResync();
    };

    const onFocus = () => {
      void runResync();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    void setup();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
