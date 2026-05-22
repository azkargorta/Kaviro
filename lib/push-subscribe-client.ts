/** Convierte clave VAPID pública (base64url) a ArrayBuffer para PushManager. */
export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  if (!base64String) return new ArrayBuffer(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export function vapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

/** Registra o actualiza la suscripción push en el servidor (best-effort). */
export async function syncPushSubscription(): Promise<"ok" | "no_vapid" | "denied" | "unsupported" | "error"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  const key = vapidPublicKey();
  if (!key) return "no_vapid";
  if (Notification.permission !== "granted") return "denied";

  try {
    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    const resp = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sub),
    });
    if (!resp.ok) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

/** Pide permiso y sincroniza suscripción. */
export async function requestPushPermissionAndSubscribe(): Promise<
  "ok" | "denied" | "no_vapid" | "unsupported" | "error"
> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  const key = vapidPublicKey();
  if (!key) return "no_vapid";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const sync = await syncPushSubscription();
  return sync === "ok" ? "ok" : sync;
}
