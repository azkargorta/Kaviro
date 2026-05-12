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

    if (process.env.NODE_ENV !== "production" && isLocalhost) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        // Request push notification permission after SW registers
        if ("PushManager" in window && "Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          try {
            // Check for existing subscription
            const existing = await registration.pushManager.getSubscription();
            if (existing) return; // Already subscribed

            // Subscribe to push
            const sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              // Replace with your VAPID public key for real push
              applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
              ),
            });

            // Send subscription to API
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub),
            });
          } catch {
            // Push subscription failed — non-blocking
          }
        }
      })
      .catch(() => {
        // SW registration failed — non-blocking
      });
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array();
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
