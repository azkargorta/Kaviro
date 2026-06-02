"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";
import { writeTextToClipboard } from "@/lib/clipboard";
import { useToast } from "@/components/ui/toast";

export default function RecapShareButton({ tripId, tripName }: { tripId: string; tripName?: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function shareRecap() {
    setBusy(true);
    try {
      const resp = await fetch("/api/trip-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tripId, kind: "recap" }),
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
      const token = String(payload?.share?.token || "");
      if (!token) throw new Error("No se pudo crear el enlace.");

      const url = `${window.location.origin}/share/recap/${token}`;
      const title = tripName?.trim() ? `Recap: ${tripName.trim()}` : "Recap del viaje";

      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title, text: "Mira el recap de nuestro viaje en Kaviro", url });
          toast.success("Recap compartido", "Enlace enviado desde el menú de compartir.");
          return;
        } catch (shareErr) {
          if (shareErr instanceof Error && shareErr.name === "AbortError") return;
        }
      }

      const copied = await writeTextToClipboard(url);
      if (copied) {
        toast.success("Enlace del recap copiado", "Pégalo en redes o WhatsApp.");
      } else {
        toast.info("Enlace creado", url);
      }
    } catch (e) {
      toast.error("No se pudo compartir", e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void shareRecap()}
      disabled={busy}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-100"
    >
      {typeof navigator !== "undefined" && "share" in navigator ? (
        <Share2 className="h-4 w-4" aria-hidden />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden />
      )}
      {busy ? "Creando enlace…" : "Compartir recap público"}
    </button>
  );
}
