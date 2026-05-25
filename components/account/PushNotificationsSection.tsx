"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  requestPushPermissionAndSubscribe,
  resyncPushIfPreferencesEnabled,
  unsubscribePushSubscription,
  vapidPublicKey,
} from "@/lib/push-subscribe-client";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
  PUSH_NOTIFICATION_EVENT_OPTIONS,
  type PushNotificationPreferences,
} from "@/lib/push-notification-preferences";

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function PushNotificationsSection() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PushNotificationPreferences>(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const hasVapid = Boolean(vapidPublicKey());

  const loadPreferences = useCallback(async () => {
    try {
      const resp = await fetch("/api/push/preferences", { credentials: "include" });
      if (!resp.ok) return;
      const data = (await resp.json()) as { preferences?: PushNotificationPreferences };
      if (data.preferences) setPrefs(data.preferences);
    } finally {
      setPrefsLoaded(true);
    }
  }, []);

  const refreshDeviceSubscription = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setDeviceSubscribed(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setDeviceSubscribed(Boolean(sub));
    } catch {
      setDeviceSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    void loadPreferences();
    void refreshDeviceSubscription();
    if (Notification.permission === "granted") void resyncPushIfPreferencesEnabled().then(() => refreshDeviceSubscription());
  }, [loadPreferences, refreshDeviceSubscription]);

  async function savePreference(patch: Partial<PushNotificationPreferences>, key: string) {
    setSavingKey(key);
    try {
      const resp = await fetch("/api/push/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!resp.ok) return;
      const data = (await resp.json()) as { preferences?: PushNotificationPreferences };
      if (data.preferences) setPrefs(data.preferences);
    } finally {
      setSavingKey(null);
    }
  }

  async function enableNotifications() {
    setBusy(true);
    try {
      const result = await requestPushPermissionAndSubscribe();
      setPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");
      if (result === "ok") {
        await savePreference({ enabled: true }, "enabled");
        await refreshDeviceSubscription();
      }
    } finally {
      setBusy(false);
    }
  }

  async function disableOnDevice() {
    setBusy(true);
    try {
      await unsubscribePushSubscription();
      await savePreference({ enabled: false }, "enabled");
      setDeviceSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  if (!hasVapid) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Las notificaciones push no están configuradas en este entorno (falta VAPID).
      </p>
    );
  }

  if (permission === "unsupported") return null;

  const canConfigure = permission === "granted" && deviceSubscribed;
  const masterDisabled = !canConfigure || !prefs.enabled;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones del viaje</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Avisos en el móvil cuando pasa algo en tus viajes (PWA instalada o navegador con permiso).
                </p>
              </div>
              {canConfigure ? (
                <ToggleSwitch
                  checked={prefs.enabled}
                  disabled={busy || savingKey === "enabled"}
                  label="Activar notificaciones del viaje"
                  onChange={(enabled) => {
                    setPrefs((prev) => ({ ...prev, enabled }));
                    void savePreference({ enabled }, "enabled");
                  }}
                />
              ) : null}
            </div>

            {permission === "granted" && deviceSubscribed && prefs.enabled ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Activadas en este dispositivo</p>
            ) : null}

            {permission === "denied" ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                Bloqueadas en el navegador. Actívalas en Ajustes del sitio → Notificaciones.
              </p>
            ) : permission !== "granted" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void enableNotifications()}
                className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {busy ? "Activando…" : "Activar notificaciones"}
              </button>
            ) : !deviceSubscribed ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void enableNotifications()}
                className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {busy ? "Registrando…" : "Registrar este dispositivo"}
              </button>
            ) : null}

            {canConfigure ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void disableOnDevice()}
                className="mt-3 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                Quitar notificaciones de este dispositivo
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {prefsLoaded && permission === "granted" ? (
        <div
          className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/30 ${
            masterDisabled ? "opacity-60" : ""
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qué quieres que te avise</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {masterDisabled
              ? "Activa las notificaciones del viaje para elegir los tipos de aviso."
              : "Elige qué eventos del viaje quieres recibir en este dispositivo."}
          </p>
          <ul className="mt-4 space-y-3">
            {PUSH_NOTIFICATION_EVENT_OPTIONS.map((option) => (
              <li
                key={option.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 dark:border-slate-700/80"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{option.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                </div>
                <ToggleSwitch
                  checked={prefs[option.key]}
                  disabled={masterDisabled || savingKey === option.key}
                  label={option.label}
                  onChange={(value) => {
                    setPrefs((prev) => ({ ...prev, [option.key]: value }));
                    void savePreference({ [option.key]: value }, option.key);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
