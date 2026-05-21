"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withTimeout } from "@/lib/with-timeout";

const CONFIRM_PHRASE = "ELIMINAR";

export default function AccountDeleteSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    if (confirm.trim().toUpperCase() !== CONFIRM_PHRASE) {
      setError(`Escribe ${CONFIRM_PHRASE} para confirmar.`);
      return;
    }
    setBusy(true);
    try {
      const resp = await withTimeout(
        fetch("/api/account/delete", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
        }),
        30_000,
        "Timeout eliminando la cuenta."
      );
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
      router.push("/auth/login?deleted=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-800 dark:text-rose-300">Zona de peligro</p>
      <h2 className="mt-1 text-xl font-bold text-rose-950 dark:text-rose-100">Eliminar cuenta</h2>
      <p className="mt-2 text-sm text-rose-900/90 dark:text-rose-200/90">
        Se borrarán tu perfil y el acceso a la app. Los viajes compartidos seguirán existiendo para el resto del grupo. Esta
        acción no se puede deshacer.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-transparent dark:text-rose-200"
        >
          Quiero eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-rose-950 dark:text-rose-100">
            Escribe <span className="font-mono">{CONFIRM_PHRASE}</span> para confirmar
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm dark:border-rose-800 dark:bg-[#080C14] dark:text-white"
            autoComplete="off"
          />
          {error ? <p className="text-sm text-rose-800">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {busy ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-900 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
