"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import KaviroLoadingScreen from "@/components/brand/KaviroLoadingScreen";

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function isInternalNavLink(a: HTMLAnchorElement) {
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  if (a.target === "_blank" || a.hasAttribute("download")) return false;
  if (a.getAttribute("role") === "button") return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Mantiene la pantalla de carga un instante más tras la navegación para evitar el flash en blanco
 * entre el fallback de Next (`app/loading.tsx`) y el paint de la página destino.
 */
export default function GlobalRouteLoading() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef(0);
  const pathnameRef = useRef(pathname);

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function show() {
    clearHideTimer();
    shownAtRef.current = Date.now();
    setVisible(true);
  }

  function scheduleHide() {
    clearHideTimer();
    const elapsed = Date.now() - shownAtRef.current;
    const minVisible = 280;
    const wait = Math.max(0, minVisible - elapsed);

    hideTimerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(false);
        });
      });
    }, wait);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isModifiedClick(e)) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || !isInternalNavLink(a)) return;
      show();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    if (!visible) show();
    scheduleHide();
    return clearHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visible solo para no re-disparar al montar
  }, [pathname]);

  useEffect(() => () => clearHideTimer(), []);

  if (!visible) return null;

  return <KaviroLoadingScreen fixed />;
}
