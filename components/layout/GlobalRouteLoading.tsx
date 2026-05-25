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

/** Solo mostrar overlay si la navegación tarda más de este umbral (evita flash en cambios rápidos). */
const SHOW_DELAY_MS = 160;
/** Tiempo mínimo visible una vez mostrado (evita parpadeo). */
const MIN_VISIBLE_MS = 140;

/**
 * Overlay de carga solo en navegaciones lentas.
 * Las rutas con loading.tsx propio muestran skeleton sin bloquear toda la pantalla.
 */
export default function GlobalRouteLoading() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef(0);
  const pathnameRef = useRef(pathname);
  const visibleRef = useRef(false);

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function clearShowTimer() {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }

  function setVisibleState(next: boolean) {
    visibleRef.current = next;
    setVisible(next);
  }

  function scheduleShow() {
    clearShowTimer();
    showTimerRef.current = setTimeout(() => {
      shownAtRef.current = Date.now();
      setVisibleState(true);
    }, SHOW_DELAY_MS);
  }

  function scheduleHide() {
    clearShowTimer();
    if (!visibleRef.current) return;

    clearHideTimer();
    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimerRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setVisibleState(false);
      });
    }, wait);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isModifiedClick(e)) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || !isInternalNavLink(a)) return;
      scheduleShow();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    scheduleHide();
    return clearHideTimer;
  }, [pathname]);

  useEffect(
    () => () => {
      clearHideTimer();
      clearShowTimer();
    },
    []
  );

  if (!visible) return null;

  return <KaviroLoadingScreen fixed />;
}
