"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  requestPushPermissionAndSubscribe,
  syncPushSubscription,
  vapidPublicKey,
} from "@/lib/push-subscribe-client";

export default function PushNotificationsSection() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const hasVapid = Boolean(vapidPublicKey());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === "granted") void syncPushSubscription();
  }, []);

  if (!hasVapid) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Las notificaciones push no están configuradas en este entorno (falta VAPID).
      </p>
    );
  }

  if (permission === "unsupported") return null;

  async function enable() {
    setBusy(true);
    try {
      const result = await requestPushPermissionAndSubscribe();
      setPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");
      if (result === "denied") return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
          <Bell className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones del viaje</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Actividades nuevas, gastos e invitaciones al viaje en tu móvil (PWA instalada o navegador con permiso).
          </p>
          {permission === "granted" ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Activadas</p>
          ) : permission === "denied" ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Bloqueadas en el navegador. Actívalas en Ajustes del sitio → Notificaciones.
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void enable()}
              className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Activando…" : "Activar notificaciones"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
