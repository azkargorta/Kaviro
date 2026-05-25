"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LOGGED_IN_ROUTES = ["/dashboard", "/account", "/pricing", "/help"] as const;

/** Precarga rutas frecuentes cuando el usuario ya está logueado. */
export default function LoggedInRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      for (const route of LOGGED_IN_ROUTES) {
        router.prefetch(route);
      }
    };
    const timer = window.setTimeout(run, 400);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
