"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Users, UserPlus, Loader2 } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";
import { useToast } from "@/components/ui/toast";
import type { TripRole } from "@/lib/participants";

type Mate = {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_kind: string | null;
  avatar_emoji: string | null;
  avatar_illustration: string | null;
  shared_trips_count: number;
  last_shared_at: string | null;
};

type Props = {
  tripId: string;
};

const INVITE_ROLES: Array<{ id: TripRole; label: string }> = [
  { id: "viewer", label: "Solo ver" },
  { id: "editor", label: "Editar plan" },
];

export default function TravelMatesInvitePanel({ tripId }: Props) {
  const toast = useToast();
  const [mates, setMates] = useState<Mate[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<TripRole>("viewer");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsMigration(false);
    try {
      const res = await fetch(
        `/api/profile/travel-mates?tripId=${encodeURIComponent(tripId)}`,
        { credentials: "include", cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503 || data?.needsMigration) {
          setNeedsMigration(true);
          setMates([]);
          setPendingIds(new Set());
          return;
        }
        throw new Error(data?.error || "No se pudieron cargar los compañeros.");
      }
      setMates(Array.isArray(data.mates) ? data.mates : []);
      setPendingIds(
        new Set(
          Array.isArray(data.pendingInviteeIds)
            ? data.pendingInviteeIds.filter((id: unknown) => typeof id === "string")
            : []
        )
      );
    } catch (e) {
      setMates([]);
      setPendingIds(new Set());
      setError(e instanceof Error ? e.message : "No se pudieron cargar los compañeros.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function inviteMate(mate: Mate) {
    setInvitingId(mate.user_id);
    try {
      const res = await fetch("/api/trip-member-invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          inviteeUserId: mate.user_id,
          displayName: mate.full_name || mate.username,
          role: inviteRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo invitar");
      setPendingIds((prev) => new Set(prev).add(mate.user_id));
      toast.success(
        "Invitación enviada",
        `${mate.full_name || mate.username} la verá en Mis viajes y podrá aceptar o rechazar.`
      );
    } catch (e) {
      toast.error("Error", e instanceof Error ? e.message : "No se pudo invitar");
    } finally {
      setInvitingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando compañeros…
      </div>
    );
  }

  if (needsMigration) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs leading-relaxed">
            Las funciones sociales aún no están activas. Ejecuta{" "}
            <code className="text-[10px]">docs/kaviro_social_features.sql</code> en Supabase para invitar compañeros
            habituales.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900/40 dark:bg-rose-950/20">
        <p className="text-xs text-rose-800 dark:text-rose-200">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-bold text-rose-800 hover:bg-rose-50"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Reintentar
        </button>
      </div>
    );
  }

  if (!mates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-900/20">
        <Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
        <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Cuando compartas un viaje con alguien que tenga cuenta Kaviro, aparecerá aquí para invitarle más rápido.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F87171]/20 bg-[#F87171]/5 p-4 shadow-sm dark:border-[#F87171]/15 dark:bg-[#F87171]/5">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F87171]/15 text-[#F87171]">
          <Users className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Compañeros habituales</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Personas con las que ya has viajado en Kaviro. Les llegará la invitación a Mis viajes.
          </p>
          <label className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Rol al invitar
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TripRole)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-800 dark:border-slate-600 dark:bg-[#0F1623] dark:text-slate-100"
            >
              {INVITE_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {mates.map((mate) => {
          const label = mate.full_name || mate.username;
          const sent = pendingIds.has(mate.user_id);
          const busy = invitingId === mate.user_id;

          return (
            <li
              key={mate.user_id}
              className="flex items-center gap-3 rounded-xl border border-white/80 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-[#0F1623]"
            >
              <UserAvatar
                displayName={label}
                avatarKind={mate.avatar_kind}
                avatarEmoji={mate.avatar_emoji}
                avatarIllustration={mate.avatar_illustration}
                size="sm"
                ringClassName="ring-1 ring-slate-200 dark:ring-slate-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{label}</p>
                <p className="text-[10px] text-slate-500">
                  @{mate.username} · {mate.shared_trips_count} viaje
                  {mate.shared_trips_count === 1 ? "" : "s"} juntos
                </p>
              </div>
              <button
                type="button"
                disabled={sent || busy}
                onClick={() => void inviteMate(mate)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#F87171] px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#EF4444] disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                ) : (
                  <UserPlus className="h-3 w-3" aria-hidden />
                )}
                {sent ? "Pendiente" : "Invitar"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
