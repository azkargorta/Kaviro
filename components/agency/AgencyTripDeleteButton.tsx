"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Props = {
  tripId: string;
  tripName: string;
  /** Tras eliminar, navegar aquí (por defecto lista de viajes agencia). */
  redirectTo?: string;
  /** Botón compacto solo icono. */
  compact?: boolean;
  className?: string;
};

export default function AgencyTripDeleteButton({
  tripId,
  tripName,
  redirectTo = "/agency",
  compact = false,
  className = "",
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `¿Eliminar el viaje «${tripName}»?\n\nSe borrarán plan, rutas, documentos y datos asociados. Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      toast.push({ kind: "success", title: "Viaje eliminado" });
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "No se pudo eliminar el viaje",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void onDelete()}
        disabled={deleting}
        className={`inline-flex items-center rounded-xl border border-red-200 px-2 py-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 ${className}`}
        aria-label={deleting ? "Eliminando…" : "Eliminar viaje"}
        title="Eliminar viaje"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onDelete()}
      disabled={deleting}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:bg-[#0F1623] dark:text-red-300 dark:hover:bg-red-950/30 ${className}`}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
      {deleting ? "Eliminando…" : "Eliminar viaje"}
    </button>
  );
}
