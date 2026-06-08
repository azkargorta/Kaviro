"use client";

import { useState } from "react";
import type { ProfileSearchResult, TripParticipant } from "@/hooks/useTripParticipants";
import { btnPrimary } from "@/components/ui/brandStyles";
import { Link2, Search, Loader2, X } from "lucide-react";

type Props = {
  participant: TripParticipant;
  onSearchProfiles: (query: string) => Promise<ProfileSearchResult[]>;
  onLinkProfile: (profile: ProfileSearchResult) => Promise<void>;
  onCancel?: () => void;
};

export default function ParticipantLinkProfilePanel({
  participant,
  onSearchProfiles,
  onLinkProfile,
  onCancel,
}: Props) {
  const [query, setQuery] = useState(participant.email ?? participant.username ?? participant.display_name);
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const q = query.trim().replace(/^@+/, "");
    if (q.length < 2) {
      setError("Escribe al menos 2 caracteres (usuario o email).");
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextResults = await onSearchProfiles(q);
      setResults(nextResults);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar perfiles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm dark:border-violet-900/50 dark:bg-[#0F1623]">
      <div className="flex items-start gap-3 border-b border-violet-100 bg-violet-50/80 px-5 py-4 dark:border-violet-900/40 dark:bg-violet-950/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-violet-950 dark:text-violet-100">Vincular cuenta</h4>
          <p className="mt-0.5 text-xs font-semibold text-violet-800 dark:text-violet-300">
            {participant.display_name}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Busca un usuario de Kaviro por nombre de usuario. El email solo aparece si lo tiene público.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="space-y-4 px-5 py-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Buscar usuario
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-[#334155] dark:bg-[#080C14] dark:text-white dark:placeholder:text-slate-600"
              placeholder="username o email"
              autoComplete="off"
            />
          </div>
        </label>

        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          {loading ? "Buscando…" : "Buscar perfil"}
        </button>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#334155] dark:bg-[#080C14]"
            >
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {profile.full_name || profile.username}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">
                @{profile.username}
                {profile.email ? ` · ${profile.email}` : " · sin email público"}
              </div>
              <button
                type="button"
                onClick={() => void onLinkProfile(profile)}
                className={`${btnPrimary} mt-3 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm`}
              >
                <Link2 className="h-4 w-4" aria-hidden />
                Vincular con {participant.display_name}
              </button>
            </div>
          ))}

          {!loading && searched && results.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-bold">No hay ningún usuario de Kaviro con ese nombre o email.</p>
              <p className="mt-1.5 font-semibold text-amber-900/90 dark:text-amber-200/90">
                Es posible que aún no tenga cuenta. En ese caso, envíale el enlace de invitación por WhatsApp: al
                registrarse entrará directamente al viaje.
              </p>
            </div>
          ) : !loading && !searched ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-400">
              Busca por @usuario o email. Solo aparecen personas con cuenta en Kaviro.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
