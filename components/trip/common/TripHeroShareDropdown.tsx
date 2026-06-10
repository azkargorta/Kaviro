"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Link2, MessageCircle, Share2 } from "lucide-react";
import { writeTextToClipboard } from "@/lib/clipboard";
import { useToast } from "@/components/ui/toast";
import { buildTodayPlanWhatsAppText, whatsAppShareUrl } from "@/lib/today-plan-share";
import type { TripActivity } from "@/hooks/useTripActivities";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

const HERO_BTN =
  "inline-flex shrink-0 min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/90 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#F87171] shadow-sm transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:opacity-60";

const ITEM_BASE =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:text-slate-100 dark:hover:bg-[#1E293B]";

export default function TripHeroShareDropdown({ tripId, tripName, destination }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState<null | "link" | "whatsapp">(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const toast = useToast();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  }

  async function shareLink() {
    setBusy("link");
    try {
      const resp = await fetch("/api/trip-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tripId }),
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error ?? `Error ${resp.status}`);
      const token = String(payload?.share?.token ?? "");
      if (!token) throw new Error("No se pudo crear el enlace.");
      const url = `${window.location.origin}/share/${token}`;
      const copied = await writeTextToClipboard(url);
      if (!copied) {
        window.prompt("Copia el enlace (solo lectura):", url);
      } else {
        toast.success("Enlace copiado", "Solo lectura. Pégalo donde quieras compartirlo.");
      }
    } catch (e) {
      toast.error("Error al compartir", e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function shareWhatsApp() {
    setBusy("whatsapp");
    try {
      const resp = await fetch(
        `/api/trip-activities?tripId=${encodeURIComponent(tripId)}`,
        { credentials: "include" }
      );
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error ?? `Error ${resp.status}`);
      const activities = (payload?.activities ?? []) as TripActivity[];
      const text = buildTodayPlanWhatsAppText({ tripName, destination, activities });
      window.open(whatsAppShareUrl(text), "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(
        "No se pudo preparar el plan",
        e instanceof Error ? e.message : "Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  const panel =
    mounted && open
      ? createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-[9999] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]"
            role="menu"
            aria-label="Opciones de compartir"
          >
            <button
              type="button"
              disabled={busy === "link"}
              onClick={() => void shareLink()}
              className={ITEM_BASE}
              role="menuitem"
            >
              <Link2 className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
              {busy === "link" ? "Creando enlace…" : "Compartir sin cuenta"}
            </button>

            <div className="my-1 mx-3 h-px bg-slate-100 dark:bg-[#1E293B]" aria-hidden />

            <button
              type="button"
              disabled={busy === "whatsapp"}
              onClick={() => void shareWhatsApp()}
              className={ITEM_BASE}
              role="menuitem"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              {busy === "whatsapp" ? "Preparando…" : "Plan de hoy en WhatsApp"}
            </button>

          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={HERO_BTN}
      >
        <Share2 className="h-3.5 w-3.5 shrink-0 text-[#F87171]" aria-hidden />
        Compartir
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-[#F87171] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {panel}
    </>
  );
}
