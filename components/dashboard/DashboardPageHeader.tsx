"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Briefcase, HelpCircle, Menu, Shield, Tag, User } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { iconInline16 } from "@/components/ui/iconTokens";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

type Props = {
  isAdmin?: boolean;
  heroMode?: boolean;
};

type MenuAnchor = { top: number; right: number };

export default function DashboardPageHeader({ isAdmin: isAdminProp, heroMode = false }: Props) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(Boolean(isAdminProp));
  const [hasAgency, setHasAgency] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof isAdminProp === "boolean") {
      setIsAdmin(isAdminProp);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { admin?: boolean }) => {
        if (!cancelled) setIsAdmin(Boolean(data.admin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdminProp]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agencies/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok?: boolean; agency?: unknown }) => {
        if (!cancelled) setHasAgency(Boolean(data.ok && data.agency));
      })
      .catch(() => {
        if (!cancelled) setHasAgency(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMenuAnchor(null);
      return;
    }
    const updateAnchor = () => {
      const btn = menuButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setMenuAnchor({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      const target = e.target as Node;
      if (root?.contains(target)) return;
      const menu = document.getElementById("dashboard-account-menu");
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  const dropItem =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-[#1E293B]";

  const menuButtonClass = heroMode
    ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 [&_svg]:text-white"
    : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]";

  const menuPanel = open && menuAnchor ? (
    <div
      id="dashboard-account-menu"
      role="menu"
      style={{ position: "fixed", top: menuAnchor.top, right: menuAnchor.right, zIndex: 9999 }}
      className="w-max min-w-[13.5rem] max-w-[min(calc(100vw-1.5rem),17rem)] rounded-2xl border border-slate-200/90 bg-white py-1.5 shadow-xl ring-1 ring-slate-900/[0.06] dark:border-[#1E293B] dark:bg-[#0F1623]"
    >
      <div className="px-1.5" onClick={() => setOpen(false)}>
        <Link
          href={hasAgency ? "/agency" : "/empresa"}
          role="menuitem"
          className={`${dropItem} text-[#1e3a5f] dark:text-sky-200`}
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#0f2744] text-white shadow-sm">
            <Briefcase className={iconInline16} aria-hidden />
          </span>
          {hasAgency ? KAVIRO_TRIPS_PRODUCT_NAME : `${KAVIRO_TRIPS_PRODUCT_NAME} (contactar)`}
        </Link>
        {isAdmin ? (
          <>
            <Link href="/ops" role="menuitem" className={`${dropItem} text-amber-950 dark:text-amber-200`}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-sm">
                <Shield className={iconInline16} aria-hidden />
              </span>
              Kaviro Ops
            </Link>
            <Link href="/dashboard/admin" role="menuitem" className={`${dropItem} text-slate-700 dark:text-slate-300`}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-sm">
                <Shield className={iconInline16} aria-hidden />
              </span>
              Métricas
            </Link>
          </>
        ) : null}
        <Link href="/help" role="menuitem" className={dropItem}>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm">
            <HelpCircle className={iconInline16} aria-hidden />
          </span>
          Ayuda
        </Link>
        <Link href="/pricing" role="menuitem" className={dropItem}>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Tag className={iconInline16} aria-hidden />
          </span>
          Precios
        </Link>
        <Link href="/account" role="menuitem" className={dropItem}>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F87171] to-[#EF4444] text-white shadow-sm">
            <User className={iconInline16} aria-hidden />
          </span>
          Cuenta
        </Link>
        <SignOutButton
          showIcon
          iconSlotClassName="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm"
          iconClassName={`${iconInline16} text-white opacity-95`}
          className={`${dropItem} border-0 bg-transparent text-slate-900 shadow-none ring-0 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-[#1E293B]`}
        />
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative ${open ? "z-[200]" : ""}`}>
      <div className="relative shrink-0">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={menuButtonClass}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls="dashboard-account-menu"
          aria-label="Cuenta y accesos"
        >
          <Menu className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      {typeof document !== "undefined" && menuPanel
        ? createPortal(menuPanel, document.body)
        : null}
    </div>
  );
}
