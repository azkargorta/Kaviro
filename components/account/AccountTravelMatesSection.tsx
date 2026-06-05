"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";

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

function formatLastShared(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountTravelMatesSection() {
  const [mates, setMates] = useState<Mate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsMigration(false);
    try {
      const res = await fetch("/api/profile/travel-mates", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503 || data?.needsMigration) {
          setNeedsMigration(true);
          setMates([]);
          return;
        }
        throw new Error(data?.error || "No se pudieron cargar los compañeros.");
      }
      setMates(Array.isArray(data.mates) ? data.mates : []);
    } catch (e) {
      setMates([]);
      setError(e instanceof Error ? e.message : "No se pudieron cargar los compañeros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="card-soft p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F87171]/15 text-[#F87171]">
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
            Compañeros de viaje
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Personas con las que ya has compartido viajes en Kaviro. Al invitar participantes en un viaje, aparecerán en
            «Compañeros habituales» para reutilizarlos más rápido.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando…
        </div>
      ) : needsMigration ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          Las funciones sociales aún no están activas en la base de datos. Ejecuta{" "}
          <code className="text-xs">docs/kaviro_social_features.sql</code> en Supabase.
        </p>
      ) : error ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
          >
            Reintentar
          </button>
        </div>
      ) : !mates.length ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Aún no tienes compañeros guardados. Cuando alguien con cuenta Kaviro se una a uno de tus viajes, aparecerá aquí.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {mates.map((mate) => {
            const label = mate.full_name || mate.username;
            const last = formatLastShared(mate.last_shared_at);
            return (
              <li
                key={mate.user_id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-[#0F1623]"
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
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500">
                    @{mate.username} · {mate.shared_trips_count} viaje
                    {mate.shared_trips_count === 1 ? "" : "s"} juntos
                    {last ? ` · último: ${last}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
