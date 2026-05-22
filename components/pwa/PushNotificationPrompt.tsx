"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  requestPushPermissionAndSubscribe,
  syncPushSubscription,
  vapidPublicKey,
} from "@/lib/push-subscribe-client";

const DISMISS_KEY = "kaviro-push-prompt-dismissed";

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!vapidPublicKey()) return;
    if (!("Notification" in window)) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    if (Notification.permission === "granted") {
      void syncPushSubscription();
      return;
    }
    if (Notification.permission === "denied") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function enable() {
    setBusy(true);
    try {
      const result = await requestPushPermissionAndSubscribe();
      if (result === "ok") setVisible(false);
      else if (result === "denied") setVisible(false);
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white px-4 py-3 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:to-[#0F1623]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
          <Bell className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Avisos del viaje en el móvil</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Te avisamos cuando alguien añade una actividad, registra un gasto o te invita a un viaje.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void enable()}
              className="inline-flex min-h-9 items-center rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Activando…" : "Activar notificaciones"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
