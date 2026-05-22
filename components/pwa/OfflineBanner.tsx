"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

/**
 * OfflineBanner — se muestra automáticamente cuando el dispositivo pierde conexión.
 * Desaparece solo cuando vuelve la red.
 * Los datos mostrados en la app son de la última visita con conexión.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function onOffline() {
      setIsOffline(true);
      setWasOffline(true);
    }
    function onOnline() {
      setIsOffline(false);
    }

    // Estado inicial
    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Banner de "volviste a conectarte"
  useEffect(() => {
    if (!isOffline && wasOffline) {
      const t = setTimeout(() => setWasOffline(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !wasOffline) return null;

  // Modo sin conexión
  if (isOffline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed bottom-20 left-1/2 z-[9999] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-900/50 dark:bg-amber-950/70 sm:bottom-6"
      >
        <WifiOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Sin conexión</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Solo lectura: datos de la última vez que abriste el viaje con conexión. Los cambios no se guardan.
          </p>
        </div>
      </div>
    );
  }

  // Modo "volviste a conectarte" — verde, desaparece solo
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-[9999] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950/70 sm:bottom-6"
    >
      <RefreshCw className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Conexión restaurada</p>
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Ya puedes ver los últimos cambios del grupo.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
      >
        Actualizar
      </button>
    </div>
  );
}
