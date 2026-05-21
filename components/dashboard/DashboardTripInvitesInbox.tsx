"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Mail } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";

type InboxInvite = {
  id: string;
  trip_id: string;
  trip_name: string;
  trip_destination: string | null;
  inviter_username: string;
  inviter_name: string | null;
  inviter_avatar_kind: string | null;
  inviter_avatar_emoji: string | null;
  inviter_avatar_illustration: string | null;
  role: string;
  display_name: string | null;
  created_at: string;
};

export default function DashboardTripInvitesInbox() {
  const router = useRouter();
  const [invites, setInvites] = useState<InboxInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/trip-member-invites", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInvites([]);
        return;
      }
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(inviteId: string, action: "accept" | "decline") {
    setActingId(inviteId);
    try {
      const res = await fetch(`/api/trip-member-invites/${encodeURIComponent(inviteId)}/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error");
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (action === "accept" && data.redirectTo) {
        router.push(String(data.redirectTo));
        router.refresh();
      }
    } catch {
      /* podría mostrarse toast en el futuro */
    } finally {
      setActingId(null);
    }
  }

  if (loading || invites.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#F87171]/25 bg-gradient-to-br from-[#F87171]/8 to-white shadow-sm dark:border-[#F87171]/20 dark:from-[#F87171]/10 dark:to-[#0F1623]"
      aria-label="Invitaciones a viajes"
    >
      <div className="flex items-center gap-2 border-b border-[#F87171]/15 px-4 py-3 dark:border-[#F87171]/20">
        <Mail className="h-4 w-4 text-[#F87171]" aria-hidden />
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
          Invitaciones a viajes
        </h2>
        <span className="ml-auto rounded-full bg-[#F87171] px-2 py-0.5 text-[10px] font-bold text-white">
          {invites.length}
        </span>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {invites.map((inv) => {
          const inviterLabel = inv.inviter_name || `@${inv.inviter_username}`;
          const busy = actingId === inv.id;

          return (
            <li key={inv.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <UserAvatar
                  displayName={inviterLabel}
                  avatarKind={inv.inviter_avatar_kind}
                  avatarEmoji={inv.inviter_avatar_emoji}
                  avatarIllustration={inv.inviter_avatar_illustration}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    <span className="text-[#F87171]">{inviterLabel}</span> te invita a{" "}
                    <Link href={`/trip/${inv.trip_id}/summary`} className="underline decoration-[#F87171]/40">
                      {inv.trip_name}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {inv.trip_destination ? inv.trip_destination : "Sin destino indicado"}
                    {" · Rol: "}
                    {inv.role}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 sm:flex-col sm:gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond(inv.id, "accept")}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F87171] px-4 text-xs font-bold text-white transition hover:bg-[#EF4444] disabled:opacity-50 sm:flex-initial"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond(inv.id, "decline")}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:flex-initial"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Rechazar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
