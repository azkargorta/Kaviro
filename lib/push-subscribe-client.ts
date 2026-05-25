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

async function postSubscriptionToServer(sub: PushSubscription): Promise<boolean> {
  const resp = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sub),
  });
  return resp.ok;
}

async function removeSubscriptionFromServer(endpoint: string): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // best-effort
  }
}

async function unsubscribeLocal(sub: PushSubscription | null): Promise<void> {
  if (!sub) return;
  try {
    await removeSubscriptionFromServer(sub.endpoint);
  } catch {
    // ignore
  }
  try {
    await sub.unsubscribe();
  } catch {
    // ignore
  }
}

async function createFreshSubscription(registration: ServiceWorkerRegistration, key: string): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  } catch {
    return null;
  }
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

    if (sub) {
      const saved = await postSubscriptionToServer(sub);
      if (saved) return "ok";
      await unsubscribeLocal(sub);
      sub = null;
    }

    sub = await createFreshSubscription(registration, key);
    if (!sub) return "error";

    const saved = await postSubscriptionToServer(sub);
    return saved ? "ok" : "error";
  } catch {
    return "error";
  }
}

/** Si el usuario tiene notificaciones activas en cuenta, re-sincroniza este dispositivo tras deploy/SW. */
export async function resyncPushIfPreferencesEnabled(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!vapidPublicKey()) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const resp = await fetch("/api/push/preferences", { credentials: "include", cache: "no-store" });
    if (resp.status === 401) return;
    if (resp.ok) {
      const data = (await resp.json()) as { preferences?: { enabled?: boolean } };
      if (data.preferences?.enabled === false) return;
    }
    await syncPushSubscription();
  } catch {
    await syncPushSubscription();
  }
}

/** Pide permiso, sincroniza suscripción y marca preferencias como activas en cuenta. */
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
  if (sync !== "ok") return sync;

  try {
    await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ enabled: true }),
    });
  } catch {
    // La suscripción push ya quedó registrada; preferencias son best-effort.
  }

  return "ok";
}

/** Cancela la suscripción push en el navegador y la elimina del servidor. */
export async function unsubscribePushSubscription(): Promise<"ok" | "unsupported" | "error"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return "ok";

    await unsubscribeLocal(sub);
    return "ok";
  } catch {
    return "error";
  }
}
