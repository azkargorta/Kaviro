"use client";

import { useState } from "react";
import { AtSign, Loader2, UserPlus } from "lucide-react";
import { normalizeUsername, isValidUsername } from "@/lib/validators/auth";
import { useToast } from "@/components/ui/toast";

type Props = {
  tripId: string;
};

export default function UsernameInvitePanel({ tripId }: Props) {
  const toast = useToast();
  const [usernameInput, setUsernameInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const username = normalizeUsername(usernameInput.replace(/^@+/, ""));
    if (!isValidUsername(username)) {
      toast.error("Username inválido", "Usa 3–20 caracteres: a-z, 0-9 o _.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/trip-member-invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          inviteeUsername: username,
          role: "viewer",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo invitar");
      toast.success(
        "Invitación enviada",
        `@${username} la verá en Mis viajes y podrá aceptar o rechazar.`
      );
      setUsernameInput("");
    } catch (err) {
      toast.error("Error", err instanceof Error ? err.message : "No se pudo invitar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          <AtSign className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Invitar por username</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Si la persona ya tiene cuenta Kaviro, escribe su @usuario y le llegará la invitación al dashboard.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleInvite(e)} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            @
          </span>
          <input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-border)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            placeholder="nombre_usuario"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !usernameInput.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
          {busy ? "Enviando…" : "Invitar"}
        </button>
      </form>
    </div>
  );
}
