"use client";

import { useEffect } from "react";
import { syncPushSubscription } from "@/lib/push-subscribe-client";

export default function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    if (process.env.NODE_ENV !== "production" && isLocalhost) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        if ("Notification" in window && Notification.permission === "granted") {
          void syncPushSubscription();
        }
      })
      .catch(() => {
        /* non-blocking */
      });
  }, []);

  return null;
}
